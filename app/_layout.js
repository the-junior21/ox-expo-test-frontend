import { Stack } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import {OneSignal} from "react-native-onesignal"
import * as Device from "expo-device"


export default function Layout() {
  RootLayout(){
    useEffect(()=>{
      const initOneSignal = async()=>{
        if(!Device.isDevice){
          console.log("not a real device");
          return;
        }
          OneSignal.initialize("7775cac3-1d16-4592-a1b1-52f11b733d87");
          await OneSignal.Notifications.requestPermission(true);
          const id = await OneSignal.User.pushSubscription.getIdAsync();
          console.log("onesignal id : ",id);
      };
      initOneSignal();
    },[])

  useEffect(() => {
    const loadLang = async () => {
      const savedLang = await AsyncStorage.getItem("language");
      if (savedLang) {
        i18n.locale = savedLang;
      }
    };
    loadLang();
  }, []);


  return <Stack screenOptions={{ headerShown: false }} />; 
 };
}
