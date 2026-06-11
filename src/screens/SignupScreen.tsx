import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirm]       = useState('');
  const [showPassword, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [loading, setLoading]               = useState(false);
  const [emailSent, setEmailSent]           = useState(false);
  const passwordRef                          = useRef<RNTextInput>(null);
  const confirmRef                           = useRef<RNTextInput>(null);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);

    if (!error) {
      setEmailSent(true);
      return;
    }

    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      Alert.alert('Erro', 'E-mail já está em uso.');
    } else {
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successArea}>
          <Text style={styles.successIcon}>📬</Text>
          <Text style={styles.successTitle}>Verifique seu e-mail</Text>
          <Text style={styles.successText}>
            Enviamos um link de confirmação para{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Ir para Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>Criar conta</Text>
          <Text style={styles.logoSubtitle}>é grátis</Text>
          <Text style={styles.logoTagline}>Comece a controlar seus gastos</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#444"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Senha */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Mín. 6 caracteres"
                placeholderTextColor="#444"
                secureTextEntry={!showPassword}
                autoComplete="off"
                textContentType="newPassword"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <Text style={[styles.passwordStrength, { color: password.length >= 8 ? '#00D4A1' : password.length >= 6 ? '#FFD93D' : '#FF6B6B' }]}>
                {password.length >= 8 ? '✓ Senha forte' : password.length >= 6 ? '○ Senha razoável' : '✗ Muito curta'}
              </Text>
            )}
          </View>

          {/* Confirmar senha */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Confirmar senha</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={confirmRef}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirm}
                placeholder="Repita a senha"
                placeholderTextColor="#444"
                secureTextEntry={!showConfirm}
                autoComplete="off"
                textContentType="newPassword"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <Text style={[styles.passwordStrength, { color: confirmPassword === password ? '#00D4A1' : '#FF6B6B' }]}>
                {confirmPassword === password ? '✓ Senhas coincidem' : '✗ Senhas diferentes'}
              </Text>
            )}
          </View>

          {/* Criar conta */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#0D0D0D" />
              : <Text style={styles.buttonText}>Criar conta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Já tem conta?{' '}
              <Text style={styles.linkHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 40,
  },

  // Logo
  logoArea: {
    marginBottom: 40,
  },
  logoTitle: {
    color: '#F5F5F5',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    color: '#00D4A1',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  logoTagline: {
    color: '#444',
    fontSize: 14,
  },

  // Form
  form: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: '#F5F5F5',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Password
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: '#F5F5F5',
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  eyeIcon: {
    fontSize: 18,
  },
  passwordStrength: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Button
  button: {
    backgroundColor: '#00D4A1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#555',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#00D4A1',
    fontWeight: '600',
  },

  // Success state
  successArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  successText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: '#00D4A1',
    fontWeight: '600',
  },
});
