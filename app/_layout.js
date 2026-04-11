import { Stack } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import {OneSignal} from "react-native-onesignal"
import {isDevice} from "expo-device"

if(isDevice){
  OneSignal.initialize("7775cac3-1d16-4592-a1b1-52f11b733d87")
  OneSignal.Notifications.requestPermission(true)
  OneSignal.Notifications.addEventListener("foregroundWillDisplay",(event)=>{
    event.preventDefault()
    event.getNotification().display()
  })
}

export default function Layout() {
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
}
