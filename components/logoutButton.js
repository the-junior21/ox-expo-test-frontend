import {Ionicons} from "@expo/vector-icons"
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable,StyleSheet } from "react-native";



const LogoutButton = ()=>{
  const handleLogout = async()=>{
    await AsyncStorage.multiRemove(["userId","role"])
    router.replace("/")
    console.log("we remove the id and role and back to ind")
  }
  return(
    <Pressable
              style={styles.button}
              onPress={handleLogout}><Ionicons name="exit-outline" size={28} color="#e96701"/>
              </Pressable>
              
  )
}
export default LogoutButton
const styles = StyleSheet.create({

    button:{
        position:"absolute",
        top:40,
        left:20,
        zIndex:10,
      },
})