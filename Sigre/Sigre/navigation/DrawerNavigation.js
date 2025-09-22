import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Map } from "../pages/Map";
import { Welcome } from "../pages/Welcome";
import { Deficiency } from "../pages/Deficiency";
import { Multimedia } from "../pages/Multimedia";
import { Deficiencies } from "../pages/Deficiencies";
import { ListMultimedia } from "../pages/ListMultimedia";
import { OffLineConfig } from "../pages/OffLineConfig";

const Drawer = createDrawerNavigator();

export function DrawerNavigation() {
    return (
        <Drawer.Navigator>
            <Drawer.Screen name="Inicio" component={Welcome} />
            <Drawer.Screen name="Mapa" component={Map} />
            <Drawer.Screen name="Deficiencias" component={Deficiencies} options={{ drawerItemStyle: { display: "none" }, unmountOnBlur: true }} />
            <Drawer.Screen name="Deficiencia" component={Deficiency} options={{ drawerItemStyle: { display: "none" }, unmountOnBlur: true }} />
            <Drawer.Screen name="Multimedia" component={Multimedia} options={{ drawerItemStyle: { display: "none" }, unmountOnBlur: true }} />
            <Drawer.Screen name="ListaMultimedia" component={ListMultimedia} options={{ drawerItemStyle: { display: "none" }, unmountOnBlur: true }} />
            <Drawer.Screen name="Offline" component={OffLineConfig} /> 
        </Drawer.Navigator>
    );
}