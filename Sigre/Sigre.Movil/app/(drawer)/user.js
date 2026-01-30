// app/(drawer)/user.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";


import { AuthContext } from "../../context/AuthContext";
import { useFeeder } from "../../hooks/useFeeder";
import { useUser } from "../../hooks/useUser";
import { modalStyles } from "../../styles/modalStyles";
import { userStyles } from "../../styles/userStyles";

export default function User() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // ✅ role desde login (user.perfilNombre)
  const role = String(user?.perfilNombre ?? "").trim().toUpperCase();
  const isAdmin = role === "ADMINISTRADOR" || role === "ADMIN";

  // ✅ GUARD: si no es admin, fuera
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Acceso restringido", "Solo el administrador puede ver este módulo.");
      router.replace("/(drawer)/map");
    }
  }, [isAdmin]);

  if (!isAdmin) return null;

  // =========================
  // DATA
  // =========================
  const { usuarios, perfiles, loading, saving, saveUser, saveUserFeeders } = useUser();
  const { feeders, getFeedersByUser } = useFeeder();

  // =========================
  // STATE
  // =========================
  const [searchFeeder, setSearchFeeder] = useState("");
  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFeeders, setModalFeeders] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ Password
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const pwdFocusedRef = useRef(false);




  // ✅ Perfil modal
  const [perfilModalVisible, setPerfilModalVisible] = useState(false);

  // ✅ Teclado → achicar modal (Android)
  const { height: screenH } = useWindowDimensions();
  const [keyboardH, setKeyboardH] = useState(0);





  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardH(e?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardH(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const kbOpen = keyboardH > 0;

  // ✅ status bar real (porque usas statusBarTranslucent)
  const statusBarH = StatusBar.currentHeight ?? 0;

  // ✅ márgenes “pro”
  const TOP_GAP = 16;
  const BOTTOM_GAP = 16;

  // ✅ altura máxima real de la tarjeta (NUNCA se sale)
  const cardMaxH = Math.max(
    260,
    screenH - statusBarH - keyboardH - TOP_GAP - BOTTOM_GAP
  );

  // ✅ Password "pro": sin espacios y sin emojis
  const sanitizePassword = (input = "") => {
    // 1) elimina espacios (incluye tabs, saltos de línea)
    let s = String(input).replace(/\s+/g, "");

    // 2) elimina emojis y símbolos "emoji-like" (cubre la gran mayoría)
    s = s.replace(
      /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,
      ""
    );

    // 3) elimina caracteres de control raros (por seguridad)
    s = s.replace(/[\u0000-\u001F\u007F]/g, "");

    return s;
  };

  // ✅ Nombres/Apellidos: "Cada Palabra Así" (primera letra mayúscula, resto minúscula)
  const formatTitleCaseWords = (input = "") => {
    const hadTrailingSpace = /\s$/.test(input);

    // normaliza espacios (sin comerse el espacio final mientras escribe)
    let s = String(input).replace(/\s+/g, " ").replace(/^\s+/, "");

    // todo a minúsculas primero
    s = s.toLowerCase();

    // mayúscula al inicio o después de espacio/guion/apóstrofe
    // (incluye letras con tildes/ñ por el rango À-ÖØ-öø-ÿ)
    s = s.replace(/(^|[ \-’'])[A-Za-zÀ-ÖØ-öø-ÿ]/g, (m) => m.toUpperCase());

    return hadTrailingSpace ? s + " " : s;
  };


  const toggleShowPassword = () => {
    const wasFocused = pwdFocusedRef.current; // ✅ guarda si ya estaba enfocado

    setShowPassword((prev) => !prev);

    // ✅ SOLO si ya estaba escribiendo, mantenemos foco (no abre teclado si estaba cerrado)
    if (wasFocused) {
      requestAnimationFrame(() => {
        passwordRef.current?.focus?.();
      });
    }
  };






  const [form, setForm] = useState({
    usuaInterno: 0,
    usuaNombres: "",
    usuaApellidos: "",
    usuaCorreo: "",
    usuaPassword: "",
    usuaActivo: true,
    perfilId: "",
  });

  const perfilSeleccionadoNombre = useMemo(() => {
    if (!form.perfilId) return "";
    const p = perfiles?.find((x) => String(x.perfInterno) === String(form.perfilId));
    return p?.perfNombre ?? "";
  }, [form.perfilId, perfiles]);


  // ✅ Snapshot del form al abrir (para saber si hubo cambios)
  const initialFormRef = useRef(null);

  // normalizador de comparación
  const norm = (v) => (v === null || v === undefined ? "" : String(v)).trim();

  // ✅ modo edición
  const isEditing = !!form.usuaInterno;

  // ✅ hay cambios? (incluye contraseña SOLO si tiene algo escrito)
  const isDirty = useMemo(() => {
    const base = initialFormRef.current;
    if (!base) return false;

    // Campos que sí cuentan como cambios “normales”
    const fields = ["usuaNombres", "usuaApellidos", "usuaCorreo", "perfilId", "usuaActivo"];

    const changed = fields.some((k) => norm(form[k]) !== norm(base[k]));

    // Contraseña: solo cuenta si el usuario escribió algo (no vacío)
    const passwordChanged = norm(form.usuaPassword).length > 0;

    return changed || passwordChanged;
  }, [
    form.usuaNombres,
    form.usuaApellidos,
    form.usuaCorreo,
    form.perfilId,
    form.usuaActivo,
    form.usuaPassword,
  ]);

  // ✅ Guardar habilitado:
  // - Nuevo usuario: sí (luego validas en handleSave)
  // - Editando: solo si hay cambios
  // - y nunca mientras "saving"
  const canSave = !saving && (!isEditing || isDirty);

  // =========================
  // ACTIONS
  // =========================
  const openModal = (userRow = null) => {
    setShowPassword(false);

    const baseForm = userRow
      ? {
        usuaInterno: userRow.usuaInterno,
        usuaNombres: userRow.usuaNombres ?? "",
        usuaApellidos: userRow.usuaApellidos ?? "",
        usuaCorreo: userRow.usuaCorreo ?? "",
        usuaPassword: "", // ✅ siempre vacío al editar (mantener actual si no se llena)
        usuaActivo: userRow.usuaActivo ?? true,
        perfilId: userRow.perfilId || "",
      }
      : {
        usuaInterno: 0,
        usuaNombres: "",
        usuaApellidos: "",
        usuaCorreo: "",
        usuaPassword: "",
        usuaActivo: true,
        perfilId: "",
      };

    setForm(baseForm);

    // ✅ Snapshot para detectar cambios y habilitar/deshabilitar Guardar
    initialFormRef.current = baseForm;

    setModalVisible(true);
  };


  const handleSave = async () => {
    try {
      // ✅ Si estás editando y no hay cambios, no hace nada (por si acaso)
      if (isEditing && !isDirty) return;

      if (!form.usuaNombres || !form.usuaCorreo) {
        Alert.alert("Error", "El nombre y correo son obligatorios.");
        return;
      }

      if (!form.perfilId) {
        Alert.alert("Error", "Seleccione un perfil.");
        return;
      }

      // ✅ NUEVO: exige contraseña
      if (!isEditing && !norm(form.usuaPassword)) {
        Alert.alert("Error", "La contraseña es obligatoria para un usuario nuevo.");
        return;
      }

      // ✅ ARMAR PAYLOAD
      const payload = { ...form };

      // ✅ EDICIÓN + contraseña vacía => NO actualizar password (y pedir confirmación)
      if (isEditing && !norm(payload.usuaPassword)) {
        // Importantísimo: NO mandar la propiedad password
        delete payload.usuaPassword;

        Alert.alert(
          "Sin nueva contraseña",
          "Estás guardando cambios sin ingresar una nueva contraseña. Se mantendrá la contraseña actual para esta cuenta.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Continuar",
              onPress: async () => {
                try {
                  await saveUser(payload);
                  setModalVisible(false);
                  Alert.alert("Éxito", "Usuario guardado correctamente");
                } catch (e) {
                  Alert.alert("Error", e?.message || "No se pudo guardar el usuario");
                }
              },
            },
          ]
        );

        return;
      }

      // ✅ Si llegó aquí:
      // - Nuevo usuario con password
      // - Editando con password nuevo (sí actualiza)
      await saveUser(payload);
      setModalVisible(false);
      Alert.alert("Éxito", "Usuario guardado correctamente");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };


  const openFeedersModal = async (userRow) => {
    setSelectedUser(userRow);
    setSelectedFeeders([]);

    const lista = await getFeedersByUser(userRow.usuaInterno);
    setSelectedFeeders(lista.map((f) => f.alimInterno));

    setModalFeeders(true);
  };

  const handleAddFeeder = (idFeeder) => {
    setSelectedFeeders((prev) => (prev.includes(idFeeder) ? prev : [...prev, idFeeder]));
  };

  const handleRemoveFeeder = (idFeeder) => {
    setSelectedFeeders((prev) => prev.filter((id) => id !== idFeeder));
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

  // =========================
  // UI
  // =========================
  if (loading) {
    return (
      <View style={userStyles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando usuarios...</Text>
      </View>
    );
  }

  const sanitizeEmail = (t = "") => {
    // 1) fuera espacios (incluye pegados con espacios)
    let s = t.replace(/\s+/g, "");

    // 2) deja solo lo “común” para correos: letras/números y @ . _ - +
    s = s.replace(/[^a-zA-Z0-9@._+-]/g, "");

    return s;
  };




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

      {/* ========================= MODAL USUARIO ========================= */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            modalStyles.modalOverlay,
            {
              flex: 1,
              alignItems: "center",
              paddingHorizontal: 16,

              // ✅ sin teclado: centrado
              // ✅ con teclado: arriba
              justifyContent: kbOpen ? "flex-start" : "center",

              // ✅ margen real arriba (statusBar) + gap
              paddingTop: statusBarH + 16,

              // ✅ cuando hay teclado, dejamos espacio real abajo
              paddingBottom: (kbOpen ? keyboardH : 0) + 16,
            },
          ]}
        >


          <View
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: cardMaxH,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              elevation: 8,
            }}
          >


            <ScrollView
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={modalStyles.modalTitle}>
                {form.usuaInterno ? "Editar Usuario" : "Nuevo Usuario"}
              </Text>

              <TextInput
                style={userStyles.input}
                placeholder="Nombres"
                placeholderTextColor="#888"
                value={form.usuaNombres}
                onChangeText={(text) => setForm({ ...form, usuaNombres: text })}
                autoCapitalize="words"
                autoCorrect={false}
              />



              <TextInput
                style={userStyles.input}
                placeholder="Apellidos"
                placeholderTextColor="#888"
                value={form.usuaApellidos}
                onChangeText={(text) => setForm({ ...form, usuaApellidos: text })}
                autoCapitalize="words"
                autoCorrect={false}
              />



              <TextInput
                style={userStyles.input}
                placeholder="Correo"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"   // iOS: teclado/auto-fill correo
                autoComplete="email"            // Android/iOS (según versión RN)
                value={form.usuaCorreo}
                onChangeText={(text) =>
                  setForm({ ...form, usuaCorreo: sanitizeEmail(text) })
                }
              />


              {/* Password + ojo */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginBottom: 12,
                  backgroundColor: "#fff",
                }}
              >
                <TextInput
                  ref={passwordRef}
                  style={{ flex: 1, paddingVertical: 10, color: "#000" }}
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}   // ✅ igual que “Nuevo usuario”
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  importantForAutofill="yes"
                  keyboardType="default"
                  value={form.usuaPassword}
                  onChangeText={(text) => {
                    const clean = sanitizePassword(text);
                    setForm((prev) => ({ ...prev, usuaPassword: clean }));
                  }}
                  maxLength={64}
                  onFocus={() => (pwdFocusedRef.current = true)}
                  onBlur={() => (pwdFocusedRef.current = false)}
                />

                <Pressable
                  focusable={false}
                  onPressIn={toggleShowPassword}
                  hitSlop={12}
                  style={{ paddingLeft: 10, paddingVertical: 6 }}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#444" />
                </Pressable>
              </View>





              {/* Perfil selector */}
              <Text style={userStyles.label}>Perfil:</Text>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setPerfilModalVisible(true);
                }}

                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: "#fff",
                  marginBottom: 12,
                }}
              >

                <Text style={{ color: form.perfilId ? "#000" : "#888" }}>
                  {form.perfilId
                    ? perfilSeleccionadoNombre || "Perfil desconocido"
                    : "Seleccione un perfil"}
                </Text>
              </TouchableOpacity>

              {/* MODAL PERFIL */}
              {/* MODAL PERFIL (PRO) */}
              <Modal
                visible={perfilModalVisible}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={() => setPerfilModalVisible(false)}
              >
                {/* ✅ Overlay centrado + cierre al tocar fuera */}
                <Pressable
                  style={[
                    modalStyles.modalOverlay,
                    {
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 16,
                      paddingTop: statusBarH + 16,
                      paddingBottom: 16,
                    },
                  ]}
                  onPress={() => setPerfilModalVisible(false)}
                >
                  {/* ✅ Card (NO cierra al tocar dentro) */}
                  <Pressable
                    onPress={() => { }}
                    style={{
                      width: "100%",
                      maxWidth: 520,
                      maxHeight: cardMaxH,
                      backgroundColor: "#fff",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      elevation: 10,
                    }}
                  >
                    {/* Header */}
                    <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                      <Text style={[modalStyles.modalTitle, { textAlign: "center" }]}>
                        Seleccionar perfil
                      </Text>
                    </View>

                    {/* Lista */}
                    <FlatList
                      data={perfiles}
                      keyExtractor={(p) => String(p.perfInterno)}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      ItemSeparatorComponent={() => (
                        <View style={{ height: 1, backgroundColor: "#eee", marginHorizontal: 8 }} />
                      )}
                      ListHeaderComponent={() => (
                        <TouchableOpacity
                          onPress={() => {
                            setForm({ ...form, perfilId: "" });
                            setPerfilModalVisible(false);
                          }}
                          style={{
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            marginHorizontal: 8,
                            borderRadius: 10,
                            backgroundColor: "#fafafa",
                            marginBottom: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text style={{ color: "#666" }}>Seleccione un perfil</Text>
                          <Ionicons name="chevron-forward" size={18} color="#999" />
                        </TouchableOpacity>
                      )}
                      renderItem={({ item }) => {
                        const selected = String(form.perfilId) === String(item.perfInterno);




                        return (
                          <TouchableOpacity
                            onPress={() => {
                              setForm({ ...form, perfilId: item.perfInterno });
                              setPerfilModalVisible(false);
                            }}
                            style={{
                              paddingVertical: 14,
                              paddingHorizontal: 12,
                              marginHorizontal: 8,
                              borderRadius: 10,
                              backgroundColor: selected ? "#f2f2f2" : "#fff",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text style={{ color: "#000", fontSize: 16 }}>
                              {item.perfNombre}
                            </Text>

                            {selected ? (
                              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={18} color="#bbb" />
                            )}
                          </TouchableOpacity>
                        );
                      }}
                      contentContainerStyle={{ paddingBottom: 10 }}
                    />

                    {/* Footer fijo */}
                    <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
                      <TouchableOpacity
                        style={userStyles.cancelButton}
                        onPress={() => setPerfilModalVisible(false)}
                      >
                        <Text style={userStyles.cancelButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>


              <TouchableOpacity
                style={[userStyles.saveButton, !canSave && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={!canSave}
              >

                <Text style={userStyles.saveButtonText}>{saving ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={userStyles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={userStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================= MODAL ALIMENTADORES ========================= */}
      <Modal
        visible={modalFeeders}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalFeeders(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContainer, { height: "85%" }]}>
            <Text style={modalStyles.modalTitle}>
              Alimentadores de {selectedUser?.usuaNombres}
            </Text>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="always"
            >
              <Text style={userStyles.sectionTitle}>Asignados</Text>
              {selectedFeeders.length > 0 ? (
                <FlatList
                  data={feeders.filter((f) => selectedFeeders.includes(f.alimInterno))}
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

              <TouchableOpacity style={userStyles.cancelButton} onPress={() => setModalFeeders(false)}>
                <Text style={userStyles.cancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
