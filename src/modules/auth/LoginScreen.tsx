import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LogIn } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { useI18n } from '@/i18n/useI18n';
import { tokens } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

import { getAuthErrorMessage, loginWithPassword } from './auth.service';

export function LoginScreen() {
  const { t } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('owner@aipos.test');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const session = await loginWithPassword({ email: email.trim(), password });
      setSession(session);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t('auth.login.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.brandColumn}>
          <Text style={styles.eyebrow}>AI-POS</Text>
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.description}>{t('auth.store.current')}</Text>
        </View>

        <View style={styles.formPanel}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.login.email')}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              style={styles.input}
              value={email}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('auth.login.password')}</Text>
            <TextInput onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <AppButton
            icon={<LogIn color={tokens.colors.inverse} size={18} />}
            loading={loading}
            onPress={submit}
            style={styles.submitButton}
          >
            {loading ? t('auth.login.loading') : t('auth.login.submit')}
          </AppButton>
          <Pressable onPress={() => setEmail('cashier@aipos.test')} style={styles.demoLink}>
            <Text style={styles.demoLinkText}>cashier@aipos.test</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    justifyContent: 'center',
    padding: 32,
  },
  shell: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
  },
  brandColumn: {
    flex: 1.1,
  },
  eyebrow: {
    color: tokens.colors.accent,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: tokens.colors.ink,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    marginTop: 10,
  },
  description: {
    color: tokens.colors.muted,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 14,
  },
  formPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: 24,
    gap: 16,
    ...tokens.shadow.soft,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: tokens.colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    color: tokens.colors.ink,
    fontSize: 17,
    paddingHorizontal: 14,
  },
  error: {
    color: tokens.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 4,
  },
  demoLink: {
    alignSelf: 'flex-start',
  },
  demoLinkText: {
    color: tokens.colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
