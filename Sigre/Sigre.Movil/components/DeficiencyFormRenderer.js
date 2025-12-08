import { DeficiencyFormMap } from "../forms/DeficiencyForms";

export const DeficiencyFormRenderer = ({ code, data, onChange }) => {
  const FormComponent = DeficiencyFormMap[code];

  if (!FormComponent) {
    return <Text>Formulario no disponible para el código {code}</Text>;
  }

  return <FormComponent data={data} onChange={onChange} />;
};