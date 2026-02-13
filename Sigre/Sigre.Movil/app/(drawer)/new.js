import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import NuevoPosteForm from '../../components/Form/GeneralData/NewPostForm';
import NuevoVanoForm from '../../components/Form/GeneralData/NewVanoForm';

import { useGap } from '../../hooks/useGap';
import { usePost } from '../../hooks/usePost';

export default function New() {

  const [tipo, setTipo] = useState(null);

  const postRef = useRef();
  const vanoRef = useRef();

  const insets = useSafeAreaInsets();

  const { savePost } = usePost();
  const { saveVano } = useGap();

  // ===============================
  // GUARDAR
  // ===============================
  const handleGuardar = async () => {

    if (!tipo) {
      Alert.alert("Aviso", "Seleccione el tipo de elemento.");
      return;
    }

    if (tipo === "poste") {
      const data = postRef.current?.getData();

      if (!data?.PostEtiqueta) {
        Alert.alert("Validación", "La etiqueta es obligatoria.");
        return;
      }

      if (!data?.PostLatitud || !data?.PostLongitud) {
        Alert.alert("Validación", "Debe ingresar latitud y longitud.");
        return;
      }

      const id = await savePost({
        ...data,
        EstadoOffLine: 1
      });

      if (!id) {
        Alert.alert("Error", "No se pudo guardar el poste.");
        return;
      }

      postRef.current?.reset();
      Alert.alert("Éxito", "Poste guardado correctamente.");
    }

    if (tipo === "vano") {
      const data = vanoRef.current?.getData();

      if (!data?.VanoCodigo) {
        Alert.alert("Validación", "El código es obligatorio.");
        return;
      }

      if (!data?.VanoNodoInicial || !data?.VanoNodoFinal) {
        Alert.alert("Validación", "Debe ingresar nodo inicial y final.");
        return;
      }

      if (data.VanoNodoInicial === data.VanoNodoFinal) {
        Alert.alert("Validación", "Nodo inicial y final no pueden ser iguales.");
        return;
      }

      const id = await saveVano({
        ...data,
        EstadoOffLine: 1
      });

      if (!id) {
        Alert.alert("Error", "No se pudo guardar el vano.");
        return;
      }

      vanoRef.current?.reset();
      Alert.alert("Éxito", "Vano guardado correctamente.");
    }
  };

  // ===============================
  // CANCELAR
  // ===============================
  const handleCancelar = () => {
    postRef.current?.reset();
    vanoRef.current?.reset();
    setTipo(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>

          {/* Selector de tipo */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, tipo === 'poste' && styles.activeButton]}
              onPress={() => setTipo('poste')}
            >
              <Text style={styles.buttonText}>Nuevo Poste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, tipo === 'vano' && styles.activeButton]}
              onPress={() => setTipo('vano')}
            >
              <Text style={styles.buttonText}>Nuevo Vano</Text>
            </TouchableOpacity>
          </View>

          {/* Scroll */}
          <ScrollView
            contentContainerStyle={{
              paddingBottom: tipo ? 170 : 20
            }}
            showsVerticalScrollIndicator={false}
          >
            {tipo === 'poste' && <NuevoPosteForm ref={postRef} />}
            {tipo === 'vano' && <NuevoVanoForm ref={vanoRef} />}
          </ScrollView>

          {/* Botones fijos inferiores */}
          {tipo && (
            <View
              style={[
                styles.fixedActions,
                { paddingBottom: insets.bottom + 10 }
              ]}
            >
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleGuardar}
              >
                <Text style={styles.actionText}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelar}
              >
                <Text style={styles.actionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },

  button: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 8,
  },

  activeButton: {
    backgroundColor: '#007bff',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  fixedActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },

  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },

});
