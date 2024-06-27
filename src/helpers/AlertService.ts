import { Response } from 'express';

class AlertService {

  public sendSuccessResponse(res: Response, status: number, msg: string, data?: any){
    res.status(200).json({
      status: status,
      msg: msg,
      list: data
    })
  }

  public sendErrorResponse(res: Response, status: number, msg: string){
    res.status(201).json({
      status: status,
      msg: msg,
    })
  }

  public sendDataResponse(res: Response, status: number, data: any){
    res.status(200).json({
      status: status,
      list: data
    })
  }

  public sendServerErrorResponse(res: Response, status: number, msg: string){
    res.status(500).json({
      status: status,
      msg: msg
    })
  }
}

export default AlertService;
