const formatDate = ( date ) => {
    var fecha = "";
    if(date != null && date.getFullYear()!==1969){
        month = ""+(date.getMonth()+1),
        day = ""+ (date.getDate()),
        year ="" +(date.getFullYear());

        if(day.length<2){
            day = '0'+day
        }
        if(month.length<2){
            month = '0'+month
        }
        fecha = year +"-"+month+"-"+day;
    }
    return fecha;
   };
export default formatDate;