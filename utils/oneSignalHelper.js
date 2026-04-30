import {OneSignal} from "react-native-onesignal"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Device from "expo-device"

const api_url = "https://ox-mvpp.onrender.com"
export const setupOnesignal = async()=>{
    try{
        if(!Device.isDevice){
            console.log("not a real device")
            return
        }
                  OneSignal.initialize("7775cac3-1d16-4592-a1b1-52f11b733d87");
                   await OneSignal.Notifications.requestPermission(true);
                   let oneSignalId = null 
                   let attempts = 0
                   while(!oneSignalId && attempts < 5){
                    await new Promise(res => setTimeout(res,2000))
                    oneSignalId = await OneSignal.User.pushSubscription.getIdAsync();
                    console.log(`attempt ${attempts + 1} - onesignalId: `,oneSignalId)
                    attempts++
                   }
          if(!oneSignalId){
            console.log(("could not get onesignalid after retires"))
            return
          }
          //get user info
          const userId = await AsyncStorage.getItem("userId")
          console.log("we show the user id by using the onesignalhelper ",userId)
          if(!userId){
            console.log("no user id")
            return
          }
          console.log("we got the user id by the helper: ",userId)
          const res = await fetch(`${api_url}/api/save-onesignal-id`,{
                method:"POST",
                headers:{
                  "Content-Type":"application/json",
                },
                body:JSON.stringify({
                  userId,
                  oneSignalId,
                }),
              });
              const data = await res.json()
              console.log("backend response:",data)
              console.log("onesignal id saved to backend")

    }catch(err){
        console.log("onesignal setup error: ",err)
    }
}
