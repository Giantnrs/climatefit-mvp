# AWS DynamoDB Setup Guide

## 1. AWS账户和权限设置

### 创建IAM用户
1. 登录AWS控制台
2. 进入IAM服务
3. 创建新用户，勾选"程序化访问"
4. 附加以下权限策略：
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "dynamodb:CreateTable",
                   "dynamodb:DescribeTable",
                   "dynamodb:GetItem",
                   "dynamodb:PutItem",
                   "dynamodb:UpdateItem",
                   "dynamodb:DeleteItem",
                   "dynamodb:Query",
                   "dynamodb:Scan"
               ],
               "Resource": [
                   "arn:aws:dynamodb:*:*:table/ClimateFit-*"
               ]
           }
       ]
   }
   ```

### 配置AWS凭证
有三种方式配置AWS凭证：

#### 方式1：环境变量
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=us-east-1
```

#### 方式2：AWS CLI配置
```bash
aws configure
```

#### 方式3：EC2实例角色 (生产环境推荐)
在EC2实例上部署时，使用IAM角色自动获取凭证。

## 2. DynamoDB表结构

应用会自动创建以下表：

### ClimateFit-Users表
- 主键：Email (String)
- 属性：
  - Username (String)
  - PasswordHash (String)
  - Preferences (JSON String)
  - History (JSON String)
  - CreatedAt (String)

### ClimateFit-Submissions表
- 主键：Id (String)
- 属性：
  - Email (String)
  - Time (String)
  - Onboarding (JSON String)
  - Cities (JSON String)

## 3. 配置设置

在 `appsettings.json` 中设置：
```json
{
  "DynamoDB": {
    "UsersTable": "ClimateFit-Users",
    "SubmissionsTable": "ClimateFit-Submissions",
    "Region": "us-east-1"
  }
}
```

## 4. 查看用户数据

### 在AWS控制台查看DynamoDB数据
1. 登录AWS控制台：https://console.aws.amazon.com
2. 搜索并进入"DynamoDB"服务
3. 在左侧菜单选择"Tables"
4. 点击`ClimateFit-Users`表查看用户数据
5. 点击`ClimateFit-Submissions`表查看提交记录
6. 在"Items"标签页可以查看具体的数据记录

### 使用AWS CLI查看数据
```bash
# 查看所有用户
aws dynamodb scan --table-name ClimateFit-Users

# 查看特定用户
aws dynamodb get-item --table-name ClimateFit-Users --key '{"Email":{"S":"user@example.com"}}'

# 查看所有提交记录
aws dynamodb scan --table-name ClimateFit-Submissions
```

## 5. 本地开发

### 使用AWS CLI
```bash
# 安装AWS CLI
# Windows: 下载并安装AWS CLI安装程序
# macOS: brew install awscli
# Linux: sudo apt-get install awscli

# 配置凭证
aws configure
```

### 使用DynamoDB Local (可选)
```bash
# 下载并运行DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

## 5. 生产部署注意事项

1. **安全性**：
   - 使用IAM角色而不是访问密钥
   - 启用VPC端点
   - 配置适当的安全组

2. **性能**：
   - 根据预期负载配置读写容量
   - 考虑使用Global Secondary Index

3. **备份**：
   - 启用时间点恢复
   - 设置定期备份策略

4. **监控**：
   - 设置CloudWatch警报
   - 监控DynamoDB指标
