import boto3
import json

s3 = boto3.client("s3")
BUCKET_NAME = "onecloud-user-files"

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        filekey = body.get("filekey")

        if not filekey:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing filekey"})
            }

        download_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': filekey},
            ExpiresIn=600
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"downloadURL": download_url}),
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
