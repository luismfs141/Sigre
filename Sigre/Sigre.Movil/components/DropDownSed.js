import { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import sedIcon from '../assets/feederMap.png'; // coloca tu imagen de SED
import { useDatos } from '../context/DatosContext';
import { getAllSedsLocal } from '../database/offlineDB/seds'; // tu método creado

export const DropDownSed = ({ onSelectSed }) => {
  const { dbReady } = useDatos();
  const [modalVisible, setModalVisible] = useState(false);
  const [seds, setSeds] = useState([]);
  const [loading, setLoading] = useState(false);

  const openModal = async () => {
    if (!dbReady) {
      alert("Primero debes descargar el modelo offline.");
      return;
    }
    setModalVisible(true);
    setLoading(true);

    try {
      const localSeds = await getAllSedsLocal();
      setSeds(localSeds);
    } catch (err) {
      console.error("Error cargando SEDs desde DB:", err);
      setSeds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sed) => {
    onSelectSed(sed);
    setModalVisible(false);
  };

  return (
    <>
      {/* Imagen flotante como dropdown */}
      <TouchableOpacity style={styles.floatBtn} onPress={openModal}>
        <Image source={sedIcon} style={styles.btnImg} />
      </TouchableOpacity>

      {/* Modal con lista de SEDs */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona una SED</Text>

            {loading ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : seds.length === 0 ? (
              <Text style={styles.emptyText}>No hay SEDs disponibles</Text>
            ) : (
              <FlatList
                data={seds}
                keyExtractor={item => item.SedInterno?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                    <Text style={styles.itemText}>
                      {item.SedCodigo || "Sin etiqueta"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatBtn: {
    position: 'absolute',
    top: "2%",  
    right: "74%",     // ← Cambia la posición para no chocar con el otro botón
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#e77d29ff', // naranja o color que quieras diferenciar
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5,
  },
  btnImg: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, color: '#333' },
  loadingText: { textAlign: 'center', padding: 10, color: '#555' },
  emptyText: { textAlign: 'center', padding: 10, color: '#999' },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  closeText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});