import { router } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AuthService from "../api/AuthService";

type GuardProps = {
  children: ReactNode;
};

type RoleGuardProps = {
  children: ReactNode;
  checkAccess: () => Promise<boolean>;
  redirectTo?: string;
};

function GuardLoader() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}

function RoleGuard({ children, checkAccess, redirectTo = "/login" }: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const runCheck = async () => {
      try {
        const ok = await checkAccess();

        if (!mounted) return;

        if (!ok) {
          setAllowed(false);
          router.replace(redirectTo as any);
          return;
        }

        setAllowed(true);
      } catch (error) {
        console.error("[RoleGuard] check failed:", error);
        if (mounted) {
          setAllowed(false);
          router.replace(redirectTo as any);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    runCheck();

    return () => {
      mounted = false;
    };
  }, [checkAccess, redirectTo]);

  if (loading) return <GuardLoader />;
  if (!allowed) return null;

  return <>{children}</>;
}

export function ProtectedGuard({ children }: GuardProps) {
  return (
    <RoleGuard
      checkAccess={async () => {
        const authenticated = await AuthService.isAuthenticated();
        if (!authenticated) return false;

        return await AuthService.refreshTokenIfNeeded();
      }}
    >
      {children}
    </RoleGuard>
  );
}

export function AdminGuard({ children }: GuardProps) {
  return (
    <RoleGuard
      checkAccess={async () => {
        const authenticated = await AuthService.isAuthenticated();
        if (!authenticated) return false;

        return await AuthService.isAdmin();
      }}
    >
      {children}
    </RoleGuard>
  );
}

export function SupportGuard({ children }: GuardProps) {
  return (
    <RoleGuard
      checkAccess={async () => {
        const authenticated = await AuthService.isAuthenticated();
        if (!authenticated) return false;

        return await AuthService.isSupport();
      }}
    >
      {children}
    </RoleGuard>
  );
}

export function SellerGuard({ children }: GuardProps) {
  return (
    <RoleGuard
      checkAccess={async () => {
        const authenticated = await AuthService.isAuthenticated();
        if (!authenticated) return false;

        return await AuthService.isSeller();
      }}
    >
      {children}
    </RoleGuard>
  );
}

export function ServiceProviderGuard({ children }: GuardProps) {
  return (
    <RoleGuard
      checkAccess={async () => {
        const authenticated = await AuthService.isAuthenticated();
        if (!authenticated) return false;

        return await AuthService.isServiceProvider();
      }}
    >
      {children}
    </RoleGuard>
  );
}