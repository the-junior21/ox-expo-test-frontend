import { Stack } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import {OneSignal} from "react-native-onesignal"
import * as Device from "expo-device"



  const api_url = "https://ox-mvpp.onrender.com"


export default function Layout() {
    useEffect(()=>{
      const initOneSignal = async()=>{
      const savedLang = await AsyncStorage.getItem("language");
      if (savedLang) {
        i18n.locale = savedLang;
      }
        if(!Device.isDevice){
          console.log("not a real device");
          return;
        }//commit
          OneSignal.initialize("7775cac3-1d16-4592-a1b1-52f11b733d87");
          await OneSignal.Notifications.requestPermission(true);
          const id = await OneSignal.User.pushSubscription.getIdAsync();
          console.log("onesignal id : ",id);
          //get user info
          const userId = await AsyncStorage.getItem("userId")
          if(id && userId){
            try {
              await fetch(`${api_url}/api/save-onesignal-id`,{
                method:"POST",
                header:{
                  "Content-Type":"application/json",
                },
                body:JSON.stringify({
                  userId,
                  id,
                }),
              });
              console.log("onesignal id saved to backend")
            }catch(err){
              console.log("error ",err)
            }
          }
      };
      initOneSignal();
    },[])

  useEffect(() => {
  
  }, []);


  return <Stack screenOptions={{ headerShown: false }} />; 
}
