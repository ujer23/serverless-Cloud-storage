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

        res = table.get_item(Key={"userid": userid})
        user = res.get("Item")

        if user and user["password"] == password:
            return {
                "statusCode": 200,
                "body": json.dumps({"success": True}),
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                }
            }
        else:
            return {
                "statusCode": 401,
                "body": json.dumps({"message": "Invalid credentials"})
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
