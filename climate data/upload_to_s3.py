#!/usr/bin/env python3
"""
Climate Data S3 Uploader

This script uploads climate data from CSV files to Amazon S3.
It can upload the complete CSV file or split it into smaller files for better management.
"""

import csv
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import pandas as pd
from tqdm import tqdm

# ===========================
# CONFIGURATION SECTION
# ===========================

# S3 Configuration
BUCKET_NAME = 'climate-data-bucket-527'  # Change to your unique S3 bucket name
AWS_REGION = 'us-east-1'  # Change to your preferred AWS region
S3_PREFIX = 'climate-data/'  # Prefix for S3 object keys

# Data File Configuration
# Options: 'quarterly', 'monthly', or 'both'
DATA_TYPE = 'monthly'  # Change this to select which data to upload
QUARTERLY_CSV_PATH = 'climate_famous300_cities_complete.csv'
MONTHLY_CSV_PATH = 'climate_famous300_cities_monthly.csv'

# Upload Configuration
OUTPUT_FORMAT = 'json'  # Options: 'json' (default), 'csv', 'jsonl' (JSON Lines)
JSON_INDENT = 2  # JSON indentation (None for compact format, 2 for readable format)

# Logging Configuration
LOG_LEVEL = 'INFO'  # Options: DEBUG, INFO, WARNING, ERROR
LOG_FILE = 's3_upload.log'

# AWS Credentials Configuration
# Option 1: Use AWS CLI credentials (recommended)
# Run: aws configure

# Option 2: Use environment variables
# export AWS_ACCESS_KEY_ID=your_access_key
# export AWS_SECRET_ACCESS_KEY=your_secret_key
# export AWS_DEFAULT_REGION=us-east-1

# Option 3: Use IAM roles (for EC2 instances)
# Attach an IAM role with S3 permissions to your EC2 instance

# Required IAM Permissions:
# - s3:CreateBucket (if bucket doesn't exist)
# - s3:PutObject
# - s3:PutObjectAcl
# - s3:ListBucket


def setup_logging():
    """Configure logging for the application."""
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL.upper()),
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(LOG_FILE, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )


def create_s3_client():
    """Create and return an S3 client."""
    try:
        s3_client = boto3.client('s3', region_name=AWS_REGION)
        logging.info(f"Successfully created S3 client for region: {AWS_REGION}")
        return s3_client
    except NoCredentialsError:
        logging.error("AWS credentials not found. Please configure your credentials.")
        raise
    except Exception as e:
        logging.error(f"Error creating S3 client: {str(e)}")
        raise


def check_bucket_exists(s3_client, bucket_name: str) -> bool:
    """Check if S3 bucket exists and is accessible."""
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        logging.info(f"Bucket '{bucket_name}' exists and is accessible")
        return True
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            logging.warning(f"Bucket '{bucket_name}' does not exist")
            return False
        elif error_code == '403':
            logging.error(f"Access denied to bucket '{bucket_name}'")
            raise
        else:
            logging.error(f"Error checking bucket: {str(e)}")
            raise


def create_bucket(s3_client, bucket_name: str) -> bool:
    """Create S3 bucket if it doesn't exist."""
    try:
        if AWS_REGION == 'us-east-1':
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': AWS_REGION}
            )
        logging.info(f"Successfully created bucket '{bucket_name}'")
        return True
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'BucketAlreadyOwnedByYou':
            logging.info(f"Bucket '{bucket_name}' already exists and is owned by you")
            return True
        elif error_code == 'BucketAlreadyExists':
            logging.error(f"Bucket '{bucket_name}' already exists and is owned by someone else")
            return False
        else:
            logging.error(f"Error creating bucket: {str(e)}")
            return False


def get_content_type(format_type: str) -> str:
    """Get content type based on output format."""
    content_types = {
        'json': 'application/json',
        'jsonl': 'application/x-ndjson',
        'csv': 'text/csv'
    }
    return content_types.get(format_type, 'application/json')


def upload_file_to_s3(s3_client, local_file_path: str, bucket_name: str, s3_key: str, content_type: str = 'application/json') -> bool:
    """Upload a file to S3."""
    try:
        file_size = os.path.getsize(local_file_path)
        logging.info(f"Uploading {local_file_path} ({file_size:,} bytes) to s3://{bucket_name}/{s3_key}")
        
        s3_client.upload_file(
            local_file_path,
            bucket_name,
            s3_key,
            ExtraArgs={
                'ContentType': content_type,
                'Metadata': {
                    'upload_timestamp': datetime.utcnow().isoformat(),
                    'original_filename': os.path.basename(local_file_path),
                    'file_size': str(file_size)
                }
            }
        )
        logging.info(f"Successfully uploaded {s3_key}")
        return True
    except Exception as e:
        logging.error(f"Error uploading {local_file_path}: {str(e)}")
        return False


def upload_string_to_s3(s3_client, content: str, bucket_name: str, s3_key: str, content_type: str = 'application/json') -> bool:
    """Upload string content to S3."""
    try:
        content_bytes = content.encode('utf-8')
        logging.info(f"Uploading content ({len(content_bytes):,} bytes) to s3://{bucket_name}/{s3_key}")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=content_bytes,
            ContentType=content_type,
            Metadata={
                'upload_timestamp': datetime.utcnow().isoformat(),
                'content_size': str(len(content_bytes)),
                'format': OUTPUT_FORMAT
            }
        )
        logging.info(f"Successfully uploaded {s3_key}")
        return True
    except Exception as e:
        logging.error(f"Error uploading content to {s3_key}: {str(e)}")
        return False


def read_csv_data(file_path: str) -> pd.DataFrame:
    """Read CSV data into a pandas DataFrame."""
    try:
        logging.info(f"Reading CSV file: {file_path}")
        df = pd.read_csv(file_path)
        logging.info(f"Successfully loaded {len(df):,} records from {file_path}")
        return df
    except Exception as e:
        logging.error(f"Error reading CSV file: {str(e)}")
        raise




def convert_dataframe_to_format(df: pd.DataFrame, format_type: str) -> str:
    """Convert DataFrame to specified format."""
    if format_type == 'json':
        # Convert to JSON with proper formatting
        # Handle NaN values by converting to None
        df_clean = df.where(pd.notnull(df), None)
        return df_clean.to_json(orient='records', indent=JSON_INDENT, force_ascii=False)
    elif format_type == 'jsonl':
        # JSON Lines format - one JSON object per line
        df_clean = df.where(pd.notnull(df), None)
        return '\n'.join(df_clean.to_json(orient='records', lines=True, force_ascii=False).split('\n'))
    elif format_type == 'csv':
        return df.to_csv(index=False)
    else:
        raise ValueError(f"Unsupported format: {format_type}")


def get_file_extension(format_type: str) -> str:
    """Get file extension based on format type."""
    extensions = {
        'json': '.json',
        'jsonl': '.jsonl',
        'csv': '.csv'
    }
    return extensions.get(format_type, '.json')


def upload_data_file(s3_client, df: pd.DataFrame, bucket_name: str, data_type: str = 'complete'):
    """Upload the complete dataset as a single file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_extension = get_file_extension(OUTPUT_FORMAT)
    s3_key = f"{S3_PREFIX}climate_famous300_cities_{data_type}_{timestamp}{file_extension}"
    
    # Convert DataFrame to specified format
    content = convert_dataframe_to_format(df, OUTPUT_FORMAT)
    content_type = get_content_type(OUTPUT_FORMAT)
    
    success = upload_string_to_s3(s3_client, content, bucket_name, s3_key, content_type)
    if success:
        logging.info(f"Successfully uploaded complete dataset to S3: s3://{bucket_name}/{s3_key}")
        logging.info(f"Format: {OUTPUT_FORMAT.upper()}, Records: {len(df):,}")
    return success




def create_upload_summary(df: pd.DataFrame, bucket_name: str, files_uploaded: List = None) -> str:
    """Create a summary of the upload operation."""
    summary = {
        'upload_timestamp': datetime.utcnow().isoformat(),
        'bucket_name': bucket_name,
        'output_format': OUTPUT_FORMAT,
        'files_uploaded': []
    }
    
    if files_uploaded:
        total_records = 0
        for file_type, file_path in files_uploaded:
            if os.path.exists(file_path):
                temp_df = pd.read_csv(file_path)
                total_records += len(temp_df)
                
                file_summary = {
                    'data_type': file_type,
                    'file_path': file_path,
                    'records': int(len(temp_df)),
                    'unique_cities': int(temp_df['city_name'].nunique()),
                    'unique_countries': int(temp_df['country_full'].nunique() if 'country_full' in temp_df.columns else temp_df['country_code'].nunique()),
                    'year_range': f"{int(temp_df['YEAR'].min())}-{int(temp_df['YEAR'].max())}",
                    'columns': list(temp_df.columns)
                }
                
                # Add type-specific information
                if file_type == 'quarterly' and 'ADJUSTED_QUARTER' in temp_df.columns:
                    file_summary['quarters_covered'] = sorted([str(q) for q in temp_df['ADJUSTED_QUARTER'].unique()])
                elif file_type == 'monthly' and 'MONTH' in temp_df.columns:
                    file_summary['months_covered'] = sorted([int(m) for m in temp_df['MONTH'].unique()])
                    file_summary['seasons_covered'] = sorted([str(s) for s in temp_df['SEASON'].unique()]) if 'SEASON' in temp_df.columns else []
                
                summary['files_uploaded'].append(file_summary)
        
        summary['total_records'] = int(total_records)
    else:
        # Fallback for single file
        summary['total_records'] = int(len(df)) if df is not None else 0
        if df is not None:
            summary['data_summary'] = {
                'unique_cities': int(df['city_name'].nunique()),
                'unique_countries': int(df['country_full'].nunique() if 'country_full' in df.columns else df['country_code'].nunique()),
                'year_range': f"{int(df['YEAR'].min())}-{int(df['YEAR'].max())}",
                'columns': list(df.columns)
            }
    
    summary['file_info'] = {
        'output_format': OUTPUT_FORMAT,
        'json_indent': JSON_INDENT if OUTPUT_FORMAT == 'json' else None
    }
    
    summary['format_details'] = {
        'content_type': get_content_type(OUTPUT_FORMAT),
        'file_extension': get_file_extension(OUTPUT_FORMAT),
        'description': {
            'json': 'Standard JSON array format with proper indentation',
            'jsonl': 'JSON Lines format - one JSON object per line',
            'csv': 'Comma-separated values format'
        }.get(OUTPUT_FORMAT, 'Unknown format')
    }
    
    return json.dumps(summary, indent=2, ensure_ascii=False)


def main(data_type=None):
    """Main function to orchestrate the S3 upload process.
    
    Args:
        data_type: 'quarterly', 'monthly', or 'both'. If None, uses DATA_TYPE from config.
    """
    setup_logging()
    
    # Use provided data_type or default from config
    if data_type is None:
        data_type = DATA_TYPE
    
    logging.info(f"Starting Climate Data S3 Upload Process ({data_type} data)")
    logging.info("="*50)
    
    try:
        # Validate configuration
        if not BUCKET_NAME or BUCKET_NAME == 'your-climate-data-bucket':
            logging.error("Please set a valid BUCKET_NAME in the configuration")
            return False
        
        # Determine which files to upload
        files_to_upload = []
        if data_type in ['quarterly', 'both']:
            if os.path.exists(QUARTERLY_CSV_PATH):
                files_to_upload.append(('quarterly', QUARTERLY_CSV_PATH))
            else:
                logging.warning(f"Quarterly data file not found: {QUARTERLY_CSV_PATH}")
        
        if data_type in ['monthly', 'both']:
            if os.path.exists(MONTHLY_CSV_PATH):
                files_to_upload.append(('monthly', MONTHLY_CSV_PATH))
            else:
                logging.warning(f"Monthly data file not found: {MONTHLY_CSV_PATH}")
        
        if not files_to_upload:
            logging.error("No data files found to upload")
            return False
        
        # Create S3 client
        s3_client = create_s3_client()
        
        # Check/create bucket
        if not check_bucket_exists(s3_client, BUCKET_NAME):
            logging.info(f"Creating bucket: {BUCKET_NAME}")
            if not create_bucket(s3_client, BUCKET_NAME):
                logging.error("Failed to create bucket")
                return False
        
        # Upload each file
        success_count = 0
        total_records = 0
        
        for file_type, file_path in files_to_upload:
            logging.info(f"Processing {file_type} data from {file_path}")
            
            # Read CSV data
            df = read_csv_data(file_path)
            total_records += len(df)
            
            # Upload data file with type-specific naming
            success = upload_data_file(s3_client, df, BUCKET_NAME, file_type)
            
            if success:
                success_count += 1
                logging.info(f"Successfully uploaded {file_type} data ({len(df):,} records)")
            else:
                logging.error(f"Failed to upload {file_type} data")
        
        if success_count == len(files_to_upload):
            # Upload summary file
            summary_content = create_upload_summary(None, BUCKET_NAME, files_to_upload)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            summary_key = f"{S3_PREFIX}upload_summary_{timestamp}.json"
            upload_string_to_s3(s3_client, summary_content, BUCKET_NAME, summary_key)
            
            logging.info("="*50)
            logging.info("S3 upload completed successfully!")
            logging.info(f"Data uploaded to bucket: {BUCKET_NAME}")
            logging.info(f"Files uploaded: {success_count}/{len(files_to_upload)}")
            logging.info(f"Total records processed: {total_records:,}")
            return True
        else:
            logging.error(f"S3 upload completed with {len(files_to_upload) - success_count} failures")
            return False
            
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return False


if __name__ == "__main__":
    import sys
    
    # Parse command line arguments
    data_type = None  # Use default from config
    
    if len(sys.argv) > 1:
        type_arg = sys.argv[1].lower()
        if type_arg in ["quarterly", "monthly", "both"]:
            data_type = type_arg
        else:
            print("Usage: python upload_to_s3.py [quarterly|monthly|both]")
            print("  quarterly: Upload only quarterly data")
            print("  monthly: Upload only monthly data")
            print("  both: Upload both quarterly and monthly data")
            print("  Default: Use DATA_TYPE from configuration")
            sys.exit(1)
    
    print(f"Starting S3 upload process...")
    success = main(data_type)
    sys.exit(0 if success else 1)
