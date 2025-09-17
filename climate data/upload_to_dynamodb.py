#!/usr/bin/env python3
"""
City Climate Profiles DynamoDB Uploader

This script uploads city climate profile data from CSV to Amazon DynamoDB.
"""

import csv
import json
import logging
import sys
from decimal import Decimal
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# ===========================
# CONFIGURATION SECTION
# ===========================

# DynamoDB Configuration
TABLE_NAME = 'CityClimateProfiles'
AWS_REGION = 'us-east-1'  # Change to your preferred AWS region

# Data File Configuration
CSV_FILE_PATH = 'city_climate_profiles.csv'

# Upload Configuration
BATCH_SIZE = 25  # Maximum batch size for DynamoDB (do not exceed 25)

# Logging Configuration
LOG_LEVEL = 'INFO'  # Options: DEBUG, INFO, WARNING, ERROR
LOG_FILE = 'dynamodb_upload.log'

# AWS Credentials Configuration
# Option 1: Use AWS CLI credentials (recommended)
# Run: aws configure

# Option 2: Use environment variables
# export AWS_ACCESS_KEY_ID=your_access_key
# export AWS_SECRET_ACCESS_KEY=your_secret_key
# export AWS_DEFAULT_REGION=us-east-1

# Option 3: Use IAM roles (for EC2 instances)
# Attach an IAM role with DynamoDB permissions to your EC2 instance

# Required IAM Permissions:
# - dynamodb:CreateTable
# - dynamodb:DescribeTable
# - dynamodb:PutItem
# - dynamodb:BatchWriteItem
# - dynamodb:Scan
# - dynamodb:Query
# - dynamodb:ListTables

# ===========================
# IMPLEMENTATION SECTION
# ===========================

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class CityClimateUploader:
    """Handles uploading city climate data to DynamoDB."""
    
    def __init__(self, table_name: str = TABLE_NAME, region_name: str = AWS_REGION):
        """Initialize the uploader."""
        self.table_name = table_name
        self.region_name = region_name
        self.dynamodb = None
        self.table = None
        
    def connect_to_dynamodb(self):
        """Establish connection to DynamoDB."""
        try:
            self.dynamodb = boto3.resource('dynamodb', region_name=self.region_name)
            logger.info(f"Connected to DynamoDB in region: {self.region_name}")
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure your credentials.")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to DynamoDB: {str(e)}")
            raise
            
    def create_table_if_not_exists(self):
        """Create DynamoDB table if it doesn't exist."""
        try:
            # Check if table exists
            existing_tables = self.dynamodb.meta.client.list_tables()['TableNames']
            
            if self.table_name in existing_tables:
                logger.info(f"Table '{self.table_name}' already exists")
                self.table = self.dynamodb.Table(self.table_name)
                return
                
            # Create table with composite primary key
            table = self.dynamodb.create_table(
                TableName=self.table_name,
                KeySchema=[
                    {
                        'AttributeName': 'city_country',
                        'KeyType': 'HASH'  # Partition key
                    },
                    {
                        'AttributeName': 'coordinates',
                        'KeyType': 'RANGE'  # Sort key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'city_country',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'coordinates',
                        'AttributeType': 'S'
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Wait for table to be created
            table.wait_until_exists()
            logger.info(f"Table '{self.table_name}' created successfully")
            self.table = table
            
        except ClientError as e:
            logger.error(f"Failed to create table: {e.response['Error']['Message']}")
            raise
            
    def convert_to_decimal(self, value: str) -> Decimal:
        """Convert string to Decimal for DynamoDB storage."""
        if value == '' or value is None:
            return Decimal('0')
        try:
            return Decimal(str(float(value)))
        except (ValueError, TypeError):
            return Decimal('0')
            
    def convert_to_int(self, value: str) -> int:
        """Convert string to integer."""
        if value == '' or value is None:
            return 0
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return 0
            
    def prepare_item(self, row: Dict[str, str]) -> Dict[str, Any]:
        """Convert CSV row to DynamoDB item format."""
        # Create composite keys
        city_country = f"{row['city_name']}, {row['country']}"
        coordinates = f"{row['lat']},{row['lon']}"
        
        item = {
            # Primary keys
            'city_country': city_country,
            'coordinates': coordinates,
            
            # Basic city information
            'city_name': row['city_name'],
            'country': row['country'],
            'hemisphere': row['hemisphere'],
            'latitude': self.convert_to_decimal(row['lat']),
            'longitude': self.convert_to_decimal(row['lon']),
            
            # Temperature data (in Celsius)
            'avg_annual_temp': self.convert_to_decimal(row['avg_annual_temp']),
            'spring_temp': self.convert_to_decimal(row['spring_TAVG']),
            'summer_temp': self.convert_to_decimal(row['summer_TAVG']),
            'autumn_temp': self.convert_to_decimal(row['autumn_TAVG']),
            'winter_temp': self.convert_to_decimal(row['winter_TAVG']),
            'summer_max_temp': self.convert_to_decimal(row['summer_TMAX']),
            'winter_min_temp': self.convert_to_decimal(row['winter_TMIN']),
            'temperature_range': self.convert_to_decimal(row['temp_range']),
            
            # Precipitation data (in mm)
            'annual_precipitation': self.convert_to_decimal(row['annual_PRCP']),
            'spring_precipitation': self.convert_to_decimal(row['spring_PRCP']),
            'summer_precipitation': self.convert_to_decimal(row['summer_PRCP']),
            'autumn_precipitation': self.convert_to_decimal(row['autumn_PRCP']),
            'winter_precipitation': self.convert_to_decimal(row['winter_PRCP']),
            
            # Seasonal characteristics
            'wettest_season': row['wettest_season'],
            'driest_season': row['driest_season'],
            'climate_type': row['climate_type'],
            
            # Data quality metrics
            'data_years': self.convert_to_int(row['data_years']),
            'total_records': self.convert_to_int(row['total_records'])
        }
        
        return item
        
    def batch_write_items(self, items: List[Dict[str, Any]]) -> bool:
        """Write a batch of items to DynamoDB."""
        try:
            with self.table.batch_writer() as batch:
                for item in items:
                    batch.put_item(Item=item)
            
            logger.info(f"Successfully wrote batch of {len(items)} items")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to write batch: {e.response['Error']['Message']}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during batch write: {str(e)}")
            return False
            
    def upload_csv_data(self, csv_file_path: str = CSV_FILE_PATH, 
                       batch_size: int = BATCH_SIZE) -> bool:
        """Upload data from CSV file to DynamoDB."""
        try:
            items_processed = 0
            batch_items = []
            
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    # Skip empty rows
                    if not row['city_name'].strip():
                        continue
                        
                    item = self.prepare_item(row)
                    batch_items.append(item)
                    
                    # Write batch when it reaches the specified size
                    if len(batch_items) >= batch_size:
                        if self.batch_write_items(batch_items):
                            items_processed += len(batch_items)
                        else:
                            logger.error(f"Failed to write batch starting at item {items_processed}")
                            return False
                        batch_items = []
                
                # Write remaining items
                if batch_items:
                    if self.batch_write_items(batch_items):
                        items_processed += len(batch_items)
                    else:
                        logger.error(f"Failed to write final batch")
                        return False
                        
            logger.info(f"Successfully uploaded {items_processed} city climate profiles to DynamoDB")
            return True
            
        except FileNotFoundError:
            logger.error(f"CSV file not found: {csv_file_path}")
            return False
        except Exception as e:
            logger.error(f"Failed to upload CSV data: {str(e)}")
            return False
            
    def verify_upload(self) -> Dict[str, Any]:
        """Verify the upload by checking table statistics."""
        try:
            response = self.table.scan(Select='COUNT')
            item_count = response['Count']
            
            # Get a sample item
            sample_response = self.table.scan(Limit=1)
            sample_item = sample_response['Items'][0] if sample_response['Items'] else None
            
            verification_results = {
                'total_items': item_count,
                'sample_item': sample_item,
                'table_status': self.table.table_status
            }
            
            logger.info(f"Verification complete: {item_count} items in table")
            return verification_results
            
        except Exception as e:
            logger.error(f"Failed to verify upload: {str(e)}")
            return {'error': str(e)}


def main():
    """Main function to execute the upload process."""
    
    logger.info("Starting City Climate Profiles DynamoDB upload")
    
    try:
        # Initialize uploader
        uploader = CityClimateUploader()
        
        # Connect to DynamoDB
        uploader.connect_to_dynamodb()
        
        # Create table if needed
        uploader.create_table_if_not_exists()
        
        # Upload data
        success = uploader.upload_csv_data()
        
        if success:
            # Verify upload
            results = uploader.verify_upload()
            print(f"\nUpload completed successfully!")
            print(f"Total items uploaded: {results.get('total_items', 'Unknown')}")
            print(f"Table: {TABLE_NAME}")
            print(f"Region: {AWS_REGION}")
            
            if results.get('sample_item'):
                print(f"\nSample item structure:")
                sample = results['sample_item']
                for key, value in list(sample.items())[:5]:  # Show first 5 fields
                    print(f"   {key}: {value}")
                if len(sample) > 5:
                    print(f"   ... and {len(sample) - 5} more fields")
        else:
            print("Upload failed. Check logs for details.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Upload interrupted by user")
        print("\nUpload interrupted")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        print(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()