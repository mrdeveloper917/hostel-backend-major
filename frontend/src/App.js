import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { Toast } from "./components/toast";

const App = () => {
  const handleLoggedIn = (response) => {
    console.log("Logged in user:", response.user);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator onLoggedIn={handleLoggedIn} />
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
