/* eslint-disable @typescript-eslint/require-await */
import {APIGatewayProxyResultV2, SQSEvent} from 'aws-lambda';

export async function main(event: SQSEvent): Promise<APIGatewayProxyResultV2> {
  // console.log('event 👉', JSON.stringify(event, null, 2));

  // throw new Error('throwing an Error 💥');

  const messages = event.Records.map(record => {
    const body = JSON.parse(record.body) as {Subject: string; Message: string};

    return {subject: body.Subject, message: body.Message};
  });

  console.log('messages 👉', JSON.stringify(messages, null, 2));

  return {
    body: JSON.stringify({messages}),
    statusCode: 200,
  };
}
