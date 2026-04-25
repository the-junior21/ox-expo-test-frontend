import { Stack ,Redirect} from "expo-router";
import { useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { useState } from "react";
import { Text } from "react-native";
import { useSegments } from "expo-router";
import { useFocusEffect } from "expo-router";


  const api_url = "https://ox-mvpp.onrender.com"


export default function Layout() {
  const [status,setStatus] = useState(null)
  const segments = useSegments()
  const inDriver = segments[0] === "driver"
  const inPassenger = segments[0] === "passenger"
  const current  = segments[segments.length -1]
  useFocusEffect(
    useCallback(()=>{
      const init = async()=>{
              const savedLang = await AsyncStorage.getItem("language");

        const userId = await AsyncStorage.getItem("userId")
        console.log("here we get the id by using layout ",userId)
        const role = await AsyncStorage.getItem("role")
        console.log("here we get the role by using layout ",role)
        if(!savedLang){
          setStatus("noLang")
        }
        else if(!userId){
          setStatus("notLogged")
        }else if(!role){
          setStatus("noRole")
        }else{
          setStatus(role)
        }
        console.log("we get the user id to stay logged")
      if (savedLang) {
        i18n.locale = savedLang;
      }          
      };
      init();
    },[])
  )
    console.log("status ",status)
    if(status === null) return <Text>Loading...</Text>
    if(status === "noLang"){
      if(current === undefined){
          return <Stack />; 
      }
      return <Redirect href="/" />
    }
    if(status === "notLogged" && current !== "signup"){
      return <Redirect href="/(auth)/signup"/>
    }
    if(status === "noRole" && current !== "choose-role"){
      return <Redirect href="/(auth)/choose-role"/>
    }
    if(status === "driver" && !inDriver){
      return <Redirect href="/driver/home"/>
    }
    if(status === "passenger" && !inPassenger){
      return <Redirect href="/passenger/home"/>
    }
 

  return <Stack screenOptions={{ headerShown: false }} />; 
}
