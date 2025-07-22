import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserFiles')

# Helper function to convert Decimals to float or int
def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj) if '.' in str(obj) else int(obj)
    return obj

def lambda_handler(event, context):
    try:
        userid = event["queryStringParameters"].get("userid")

        if not userid:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing userid"})
            }

        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userid').eq(userid)
        )

        cleaned_items = convert_decimal(response["Items"])

        return {
            "statusCode": 200,
            "body": json.dumps({"files": cleaned_items}),
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            }
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

