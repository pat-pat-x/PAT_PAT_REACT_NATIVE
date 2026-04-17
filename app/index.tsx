import { supabase } from "@/utils/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

export default function StartScreen() {
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  const redirectUrl = makeRedirectUri(
    isExpoGo ? {} : { scheme: "com.patpat.app" },
  );

  const handleOAuth = async (provider: "google" | "kakao") => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // 유저 테이블 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("terms_accepted_at")
            .eq("auth_user_id", user.id)
            .single();

          if (!profile || !profile.terms_accepted_at) {
            router.replace("/(auth)/terms");
          } else {
            router.replace("/(main)/home");
          }
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 배경 */}
      <View style={styles.bg} />

      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>PAT PAT</Text>
          <Text style={styles.subtitle}>매일의 감정을 별에 담아</Text>
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.kakaoBtn]}
            onPress={() => handleOAuth("kakao")}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnText, { color: "#191919" }]}>
              카카오로 시작하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.googleBtn]}
            onPress={() => handleOAuth("google")}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>Google로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.emailBtn]}
            onPress={() => router.push("/(auth)/signin")}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>이메일로 시작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070f24" },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#070f24",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 36,
    fontWeight: "700",
    color: "rgba(200,220,255,0.95)",
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "300",
  },
  buttons: { gap: 12 },
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  kakaoBtn: {
    backgroundColor: "#FEE500",
  },
  googleBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  emailBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
});
