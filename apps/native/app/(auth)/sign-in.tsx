import { ScrollView, View } from "react-native";
import { SignIn } from "@/components/sign-in";

const SignInScreen = () => {
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      className="bg-background p-4"
    >
      <SignIn />
    </ScrollView>
  );
};

export default SignInScreen;

