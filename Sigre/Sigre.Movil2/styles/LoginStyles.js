import { StyleSheet } from 'react-native';

const LoginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f6f9',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default LoginStyles;