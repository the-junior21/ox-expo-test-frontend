import { Stack ,Redirect} from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { router } from "expo-router";
import { useState } from "react";



  const api_url = "https://ox-mvpp.onrender.com"


export default function Layout() {
  const [status,setStatus] = useState(null)
  const [isLoggedIn , setIsLoggedIn] = useState(null)
    useEffect(()=>{
      const init = async()=>{
        const userId = await AsyncStorage.getItem("userId")
        console.log("here we get the id by using layout ",userId)
        const role = await AsyncStorage.getItem("role")
        console.log("here we get the role by using layout ",role)
        if(!userId){
          setStatus("notLogged")
        }else if(!role){
          setStatus("noRole")
        }else{
          setStatus(role)
        }
        console.log("we get the user id to stay logged")
        setIsLoggedIn(!!userId) 
      const savedLang = await AsyncStorage.getItem("language");
      if (savedLang) {
        i18n.locale = savedLang;
      }          
      };
      init();
    },[])
    if(status === null) return
    if(status === "notLogged"){
      return <Redirect href="/signup"/>
    }
    if(status === "noRole"){
      return <Redirect href="/(auth)/hello"/>
    }
    if(status === "driver"){
      return <Redirect href="/driver/home"/>
    }
    if(status === "passenger"){
      return <Redirect href="/passenger/home"/>
    }
    if(isLoggedIn === null ) return null 
    if(!isLoggedIn){
      console.log("we will back to the signup")
      return <Redirect href="/signup"/>

    }

  return <Stack screenOptions={{ headerShown: false }} />; 
}
