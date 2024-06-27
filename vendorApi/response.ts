
export default function response (statusCode: number, responsebody: any) {
    const status:number =  responsebody?.result ? 1 : 0
    const response = {
      statusCode: statusCode,
      body: JSON.parse(JSON.stringify({...responsebody, status})),
    };
    return response;
  };
