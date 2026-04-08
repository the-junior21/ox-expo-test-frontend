import { Stack } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";

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
