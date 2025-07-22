import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserData')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        userid = body.get("userid")
        password = body.get("password")

        if not userid or not password:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing userid or password"})
            }

        existing = table.get_item(Key={"userid": userid})
        if "Item" in existing:
            return {
                "statusCode": 409,
                "body": json.dumps({"message": "User already exists"})
            }

        table.put_item(Item={
            "userid": userid,
            "password": password
        })

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "User registered successfully"}),
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
