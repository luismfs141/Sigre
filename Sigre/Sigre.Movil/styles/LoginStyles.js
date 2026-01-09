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
  // --- NUEVO: CONTENEDOR INPUT CON ICONO (Para contraseña) ---
  inputContainer: {
    flexDirection: 'row',     // Fila para poner texto + icono
    alignItems: 'center',     // Centrado vertical
    height: 50,               // Misma altura que el input normal
    width: '100%',
    backgroundColor: '#fff',  // Fondo blanco igual que el input normal
    borderRadius: 8,          // Radio 8 (Uniforme)
    borderWidth: 1,           // Borde 1
    borderColor: '#bdc3c7',   // Mismo color de borde que input normal
    paddingHorizontal: 12,    // Mismo padding
    marginBottom: 15,
  },
  
  // El TextInput DENTRO del contenedor de contraseña
  inputInside: {
    flex: 1,                  // Ocupa todo el espacio menos el icono
    height: '100%',
    fontSize: 16,             // Mismo tamaño de letra
    color: '#000',
    // Sin bordes aquí, porque ya los tiene el contenedor padre
  },
  
  // Estilo para el botón del ojo
  iconButton: {
    padding: 4,               // Espacio para facilitar el toque
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginStyles;