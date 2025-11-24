import { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import feederMap from '../assets/feederMap.png'; // tu icono
import { getAllFeedersLocal } from '../database/offlineDB/feeders';

export const DropDown = ({ onSelectFeeder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [feeders, setFeeders] = useState([]);
  const [loading, setLoading] = useState(false);

  const openModal = async () => {
    setModalVisible(true);
    setLoading(true);
    try {
      const localFeeders = await getAllFeedersLocal();
      setFeeders(localFeeders);
    } catch (err) {
      console.error("Error cargando alimentadores desde DB:", err);
      setFeeders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (feeder) => {
    onSelectFeeder(feeder);
    setModalVisible(false);
  };

  return (
    <>
      {/* Imagen flotante como dropdown */}
      <TouchableOpacity style={styles.floatBtn} onPress={openModal}>
        <Image source={feederMap} style={styles.btnImg} />
      </TouchableOpacity>

      {/* Modal con lista de alimentadores */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona un alimentador</Text>

            {loading ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : feeders.length === 0 ? (
              <Text style={styles.emptyText}>No hay alimentadores disponibles</Text>
            ) : (
              <FlatList
                data={feeders}
                keyExtractor={item => item.AlimInterno?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                    <Text style={styles.itemText}>{item.AlimEtiqueta}</Text>
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
    right: "88%",
    width: 35,
    height: 35,
    borderRadius: 20,       // hace el botón circular
    backgroundColor: '#296ce7ff', // azul claro
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5, // para Android
  },
  btnImg: {
    width: 22,   // un poco más pequeño que el botón
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