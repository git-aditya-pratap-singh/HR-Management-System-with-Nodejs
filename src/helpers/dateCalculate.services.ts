import moment from "moment-timezone";

class DateCalculations {

    calculateDate = async(meanTime: number, time: any = null): Promise<any> =>{
        if (time === null) {
            time = Math.floor(new Date().getTime() / 1000);
        }
        let today = new Date(1566239400 * 1000);
        let TodayTime = Math.floor(today.getTime() / 1000) 
        if (time - TodayTime < meanTime) {
            TodayTime = Math.floor(today.setDate(today.getDate() - 1)/1000);
        }
        return TodayTime;
    }

    getDate = async(meanTime: number, time: any = null): Promise<any> =>{
        if (time !== null) {
            return time
        }else{
            time = Math.floor(new Date().getTime() / 1000);
        }
        let today = new Date(time * 1000);
        let TodayTime = Math.floor(today.getTime() / 1000);
        if(time < (TodayTime + meanTime )){
            const toDate = Math.floor((new Date().getTime() -1) / 1000);
            return toDate
        }else{
            const todayDate = Math.floor(new Date().getTime() / 1000);
            return todayDate;
        }
    }

    dateConvertIntoTimeStamp = async(date: any): Promise<any>=>{
        const m = moment.tz(`${date} 18:30:00`, 'Asia/Calcutta');
  const timestamp = m.valueOf(); // Get timestamp in milliseconds
  console.log(m.format()); // Print formatted date/time in Asia/Calcutta timezone
  return timestamp;
    }

}
export default DateCalculations;