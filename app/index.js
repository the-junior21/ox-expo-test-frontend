import { StyleSheet, View, Text, Pressable,Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import i18n from "../i18n";

export default function LanguageScreen() {
  const selectLanguage = async (lang) => {
    i18n.locale = lang;
    await AsyncStorage.setItem("language", lang);
    router.replace("/signup");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("selectLanguage")}</Text>

      <View style={styles.buttons}>
        <Pressable style={styles.lang} onPress={() => selectLanguage("en")}>
          <Text style={styles.langText}> English</Text>
          <Image source={require("../assets/images/en.jpg")} style={styles.flag}/>
        </Pressable>

        <Pressable style={styles.lang} onPress={() => selectLanguage("fr")}>
          <Text style={styles.langText}> Français</Text>
          <Image source={require("../assets/images/fr.jpg")} style={styles.flag}/>

        </Pressable>

        <Pressable style={styles.lang} onPress={() => selectLanguage("ar")}>
          <Text style={styles.langText}> العربية</Text>
         <Image source={require("../assets/images/ar.jpg")} style={styles.flag}/>

        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff7200",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
    marginBottom: 30,
  },

  buttons: {
    width: "100%",
    alignItems: "center",
    gap: 15,
  },

  lang: {
    width: "80%",          // ✅ 80% width
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 50,
    alignItems: "center",
    justifyContent:"center",  // center text horizontally
    position:"relative",
  },

  langText: {
    fontSize: 18,
    color: "#e96701",
    fontWeight: "bold",
  },
  flag:{
    width:32,
    height:32,
    position:"absolute",
    borderRadius:16,
    left:15,

  }
});
