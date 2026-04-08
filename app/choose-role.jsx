import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import i18n from "../i18n";

export default function ChooseRole() {
  const { userId } = useLocalSearchParams();
  const api_url = "https://ox-mvpp.onrender.com"
  const selectRole = async (role) => {
    await fetch(`${api_url}/api/auth/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    router.replace(role === "driver" ? "/driver/home" : "/passenger/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("chooseYourRole")}</Text>

      <Pressable
        style={styles.button}
        onPress={() => selectRole("passenger")}
      >
        <Text style={styles.text}>{i18n.t("passenger")}</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => selectRole("driver")}
      >
        <Text style={styles.text}>{i18n.t("driver")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { 
    fontSize: 22,
     marginBottom: 20,
     color:"#e96701",
     },
  button: {
    padding: 15,
    width: "80%",
    marginBottom: 15,
    backgroundColor: "#e96701",
    borderRadius: 10,
    alignItems: "center",
  },
  text: { color: "white", fontSize: 18 },
});
