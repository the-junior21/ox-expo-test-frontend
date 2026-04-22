import { Stack ,Redirect} from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { router } from "expo-router";
import { useState } from "react";



  const api_url = "https://ox-mvpp.onrender.com"


export default function Layout() {
  const [isLoggedIn , setIsLoggedIn] = useState(null)
    useEffect(()=>{
      const init = async()=>{
       // const userId = await AsyncStorage.getItem("userId")
        //setIsLoggedIn(!!userId) 
      const savedLang = await AsyncStorage.getItem("language");
      if (savedLang) {
        i18n.locale = savedLang;
      }          
      };
      init();
    },[])
   /* if(isLoggedIn === null ) return null 
    if(!isLoggedIn){
      return <Redirect href="/signup"/>

    }*/

  return <Stack screenOptions={{ headerShown: false }} />; 
}
