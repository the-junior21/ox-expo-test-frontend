import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { router } from "expo-router";
import i18n from "../../i18n";

export default function Signup() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const isValidNumber = number.length === 10
    if(!isValidNumber){
      alert("phone number must be 10 digits")
      return
    }
    if (!name || !number) {
      Alert.alert(
        `${i18n.t("error")} ${i18n.t("atleastEnterTheNameAndTheNumber")} `
      );
      return;
    }
    try {
      setLoading(true);
      const api_url = "https://ox-mvpp.onrender.com"
      const response = await fetch(`${api_url}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          number
          //email,
          //password
        }),
      });

      const data = await response.json();




      if (!response.ok) {
        Alert.alert(
          `${i18n.t("signupFailed")} ${data.message} ` ||
            `${i18n("somethingWentWrong")}`
        );
        return;
      }
      if(!data.userId){
        console.log("Signup response missing userId:",data)
        return
      }
      await AsyncStorage.setItem("userId",data.userId)
      const stored = await AsyncStorage.getItem('userId')
      console.log("stored userId: ",stored)
      router.replace("/(auth)/choose-role");
      Alert.alert(
        `${i18n.t("success")},
         ${i18n.t("accountCreatedSuccessfully")}`
      );
    } catch (error) {
      console.log(error);
      Alert.alert(`${i18n.t("networkErrorCannotConnectTheServer")}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("createAccount")}</Text>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("name")}
        placeholderTextColor={"orange"}
        value={name}
        onChangeText={setName}
        cursorColor="#fff"
      />

      {/*} <TextInput
  style={styles.input}
  placeholder={i18n.t("email")}
  placeholderTextColor="orange"
  value={email}
  onChangeText={setEmail}
  autoCapitalize="none"
  keyboardType="email-address"
  cursorColor="#fff"
  selectionColor="#fff"
  textAlign="left"
  writingDirection="ltr"
/>*/}

      <TextInput
        style={styles.input}
        placeholder={i18n.t("number")}
        keyboardType="phone-pad"
        placeholderTextColor={"orange"}
        value={number}
        onChangeText={(text) =>{
          const digitsOnly = text.replace(/[^0-9]/g, '')
          setNumber(digitsOnly)
        }}
        cursorColor="#fff"
      />

      {/*<TextInput
        style={styles.input}
        cursorColor="#fff"
        placeholder={i18n.t("password")}
        placeholderTextColor={"orange"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />*/}

      <Pressable
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={"white"} />
        ) : (
          <Text style={styles.buttonText}>{i18n.t("signup")}</Text>
        )}
      </Pressable>

     {/* <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.link}>{i18n.t("alreadyHaveAnAccount")}</Text>
      </Pressable>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#e96701",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "white",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderRadius: 50,
    borderColor: "white",
    borderTopWidth: 0,
    padding: 14,
    marginBottom: 12,
    color: "white",
  },
  button: {
    width: "80%",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#e96701",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    color: "white",
  },
});
