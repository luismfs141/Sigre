import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useFeeder } from '../../hooks/useFeeder';
import { useUser } from '../../hooks/useUser';
import { modalStyles } from "../../styles/modalStyles";
import { userStyles } from "../../styles/userStyles";

export default function User() {
  const { usuarios, perfiles, loading, saving, saveUser, saveUserFeeders } = useUser();
  const { feeders, feedersByUser, getFeedersByUser } = useFeeder();

  const [searchFeeder, setSearchFeeder] = useState("");
  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFeeders, setModalFeeders] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    usuaInterno: 0,
    usuaNombres: '',
    usuaApellidos: '',
    usuaCorreo: '',
    usuaPassword: '',
    usuaActivo: true,
    perfilId: '',
  });

  /** 🔹 Abrir modal de usuario (nuevo o editar) */
  const openModal = (user = null) => {
    if (user) {
      setForm({
        usuaInterno: user.usuaInterno,
        usuaNombres: user.usuaNombres,
        usuaApellidos: user.usuaApellidos,
        usuaCorreo: user.usuaCorreo,
        usuaPassword: '',
        usuaActivo: user.usuaActivo,
        perfilId: user.perfilId || '',
      });
    } else {
      setForm({
        usuaInterno: 0,
        usuaNombres: '',
        usuaApellidos: '',
        usuaCorreo: '',
        usuaPassword: '',
        usuaActivo: true,
        perfilId: '',
      });
    }
    setModalVisible(true);
  };

  /** 🔹 Guardar usuario */
  const handleSave = async () => {
    try {
      if (!form.usuaNombres || !form.usuaCorreo) {
        Alert.alert('Error', 'El nombre y correo son obligatorios.');
        return;
      }

      await saveUser(form);
      setModalVisible(false);
      Alert.alert('Éxito', 'Usuario guardado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

    /** 🔹 Abrir modal de alimentadores */
const openFeedersModal = async (user) => {
  setSelectedUser(user);

  // 🧹 Limpiar selección anterior
  setSelectedFeeders([]);

  // 🔹 Obtener lista del backend
  const lista = await getFeedersByUser(user.usuaInterno);

  // 📝 Usar directamente lo que retorna la función
  setSelectedFeeders(lista.map(f => f.alimInterno));

  setModalFeeders(true);
};



  /** 🔹 Seleccionar o deseleccionar un alimentador */
  const handleAddFeeder = (idFeeder) => {
    setSelectedFeeders(prev => [...prev, idFeeder]);
  };

  const handleRemoveFeeder = (idFeeder) => {
    setSelectedFeeders(prev => prev.filter(id => id !== idFeeder));
  };

  const handleSaveFeeders = async () => {
    try {
      await saveUserFeeders(selectedUser.usuaInterno, selectedFeeders);
      Alert.alert("Éxito", "Alimentadores actualizados correctamente");
      setModalFeeders(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar alimentadores");
    }
  };

  if (loading) {
    return (
      <View style={userStyles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={userStyles.container}>
      <Text style={userStyles.title}>Gestión de Usuarios</Text>

      <TouchableOpacity style={userStyles.addButton} onPress={() => openModal()}>
        <Text style={userStyles.addButtonText}>+ Nuevo Usuario</Text>
      </TouchableOpacity>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.usuaInterno.toString()}
        renderItem={({ item }) => (
          <View style={userStyles.userCard}>
            <Text style={userStyles.userName}>
              {item.usuaNombres} {item.usuaApellidos}
            </Text>
            <Text style={userStyles.userEmail}>{item.usuaCorreo}</Text>

            <View style={userStyles.actions}>
              <TouchableOpacity style={userStyles.btnEdit} onPress={() => openModal(item)}>
                <Text style={userStyles.btnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={userStyles.btnFeeder} onPress={() => openFeedersModal(item)}>
                <Text style={userStyles.btnText}>Alimentadores</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* 🔹 Modal Crear/Editar Usuario */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <ScrollView>
              <Text style={modalStyles.modalTitle}>
                {form.usuaInterno ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>

              <TextInput
                style={userStyles.input}
                placeholder="Nombres"
                value={form.usuaNombres}
                onChangeText={(text) => setForm({ ...form, usuaNombres: text })}
              />
              <TextInput
                style={userStyles.input}
                placeholder="Apellidos"
                value={form.usuaApellidos}
                onChangeText={(text) => setForm({ ...form, usuaApellidos: text })}
              />
              <TextInput
                style={userStyles.input}
                placeholder="Correo"
                value={form.usuaCorreo}
                onChangeText={(text) => setForm({ ...form, usuaCorreo: text })}
              />
              <TextInput
                style={userStyles.input}
                placeholder="Contraseña"
                secureTextEntry
                value={form.usuaPassword}
                onChangeText={(text) => setForm({ ...form, usuaPassword: text })}
              />

              <Text style={userStyles.label}>Perfil:</Text>
              <View style={userStyles.pickerContainer}>
                <Picker
                  selectedValue={form.perfilId}
                  onValueChange={(value) => setForm({ ...form, perfilId: value })}
                >
                  <Picker.Item label="Seleccione un perfil" value="" />
                  {perfiles.map((perfil) => (
                    <Picker.Item
                      key={perfil.perfInterno}
                      label={perfil.perfNombre}
                      value={perfil.perfInterno}
                    />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity style={userStyles.saveButton} onPress={handleSave} disabled={saving}>
                <Text style={userStyles.saveButtonText}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={userStyles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={userStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🔹 Modal de Alimentadores */}
    <Modal visible={modalFeeders} animationType="slide" transparent>
    <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
        <Text style={modalStyles.modalTitle}>
            Alimentadores de {selectedUser?.usuaNombres}
        </Text>

        {/* 🔹 Contenido con scroll */}
        <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
        {/* 🔹 Sección Asignados */}
        <Text style={userStyles.sectionTitle}>Asignados</Text>
        {selectedFeeders.length > 0 ? (
            <FlatList
            data={feeders.filter(f => selectedFeeders.includes(f.alimInterno))}
            keyExtractor={(f) => f.alimInterno.toString()}
            renderItem={({ item }) => (
                <View style={userStyles.assignedItem}>
                <Text style={userStyles.feederText}>{item.alimEtiqueta}</Text>
                <TouchableOpacity onPress={() => handleRemoveFeeder(item.alimInterno)}>
                    <Text style={userStyles.removeText}>❌</Text>
                </TouchableOpacity>
                </View>
            )}
            scrollEnabled={false}
            />
        ) : (
            <Text style={userStyles.noItemsText}>No hay alimentadores asignados</Text>
        )}

        {/* 🔹 Sección Disponibles */}
        <Text style={userStyles.sectionTitle}>Disponibles</Text>
        <TextInput
            style={userStyles.searchInput}
            placeholder="Buscar alimentador..."
            value={searchFeeder}
            onChangeText={setSearchFeeder}
        />

        {feeders
            .filter(
            (f) =>
                !selectedFeeders.includes(f.alimInterno) &&
                (f.alimEtiqueta.toLowerCase().includes(searchFeeder.toLowerCase()) ||
                f.alimInterno.toString().includes(searchFeeder))
            )
            .map((item) => (
            <TouchableOpacity
                key={item.alimInterno}
                style={userStyles.availableItem}
                onPress={() => handleAddFeeder(item.alimInterno)}
            >
                <Text style={userStyles.feederText}>{item.alimEtiqueta}</Text>
                <Text style={userStyles.addText}>＋</Text>
            </TouchableOpacity>
            ))}
        </ScrollView>

        {/* 🔹 Botones fijos abajo */}
        <View style={modalStyles.footerButtons}>
            <TouchableOpacity
            style={[userStyles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSaveFeeders}
            disabled={saving}
            >
            <Text style={userStyles.saveButtonText}>
                {saving ? "Guardando..." : "Guardar Cambios"}
            </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={userStyles.cancelButton}
            onPress={() => setModalFeeders(false)}
            >
            <Text style={userStyles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
        </View>
        </View>
    </View>
    </Modal>
    </View>
  );
}