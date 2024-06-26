//Responsive Navigationsleiste
document.addEventListener('DOMContentLoaded', function () {
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    menuIcon.addEventListener('click', function () {
        navLinks.classList.toggle('active');
    });
});



// INNSBRUCK
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let mapeu = L.map("mapeu", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 5);

// Hintergrundlayer
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap").addTo(mapeu),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}).addTo(mapeu);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(mapeu);



//DATENIMPORT GEOJSON EUROPA-DATEN


async function showGeojsonEU(url) {
    let response = await fetch(url);
    let geojson = await response.json();


    //ERSTELLUNG LEAFLET GEOJSON OBJEKT


    L.geoJSON(geojson, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(mapeu)
};




//Erstellung einer Sidebar für die Karte

let sidebar = L.control.sidebar('sidebar', {
    position: 'right',
    closeButton: true,
});

mapeu.addControl(sidebar);



//Erstellung eines Musters
let stripePattern = new L.StripePattern({
    weight: 5,
    spaceWeight: 4,
    color: "black",
    spaceColor: "#8A2BE2",
    angle: 45,
    opacity: 1,
});
stripePattern.addTo(mapeu);



//STYLE-Funktion GEOJSON-Objekt (Einfärbung der einzelnen Länderpolygone)

function style(feature) {
    if (feature.properties.Renewables_and_biofuels == null) {
        return {
            fillPattern: stripePattern,
            weight: 2,
            color: "white"
        };
    }

    else {
        return {
            fillColor: getColor(parseInt(feature.properties.Renewables_and_biofuels)),  //Hier ParseInt da Zahlenwert in JSON als String gespeichert
            weight: 2,
            opacity: 1,
            color: "white",
            fillOpacity: 1
        };
    }
}



//OnEachFeature Funktion GEOJSON-Objekt (PopUps etc.)

function onEachFeature(feature, layer) {
    /*layer.on({
        click: function() {sidebar.addTo(mapeu)}
    })*/
    if (feature.properties.Renewables_and_biofuels == null) {
        layer.bindPopup(
            `<h5>${feature.properties.preferred_term}</h5>
          Leider keine EUROSTAT-Daten verfügbar :(`
        )
    }

    layer.on({
        click: ClickOnFeature
    });

}





//DEFINITION DER KLASSEN für GETCOLOR und LEGENDE


klassen = [0, 15, 20, 25, 30, 35, 40];



//GetCOLOR Funktion für Angabe der Farbabstufungen (Definition der Klassengrenzen)

function getColor(a) {
    return a < klassen[1] ? "#c2dcc2" :
        a < klassen[2] ? "#acc3ac" :
            a < klassen[3] ? "#96a996" :
                a < klassen[4] ? "#808f77" :
                    a < klassen[5] ? "#687668" :
                        a < klassen[6] ? "#4f5b4f" :
                            a > klassen[6] ? "#373f37" :
                                "#E8DCCA"
}






//LEGENDE für die thematische Karte 

let legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (mapeu) {

    let div = L.DomUtil.create('div', 'info legend')
    labels = []

    div.innerHTML += "<b>Anteil* erneuerbarer Energien <br> am gesamten <br> Bruttoendenergieverbrauch<br><br></b>"

    for (let i = 0; i < klassen.length; i++) {
        let p = klassen[i + 1] - 1;
        div.innerHTML +=
            '<i style="background:' + getColor(klassen[i] + 1) + '"></i>' +
            klassen[i] + "%" + (p ? '&ndash;' + p + "%" + '<br>' : '+');
    }

    div.innerHTML += '<br><br><i>*abgerundet</i><br>'

    return div;

};

legend.addTo(mapeu);




//Funktionsaufruf zum Datenabruf

showGeojsonEU("/data/Daten_Europa.geojson");





//Funktion ClickOnFeature für einzelne Click Events für die Diagrammerstellung
function ClickOnFeature(e) {

    if (e.target.feature.properties.Renewables_and_biofuels == null) {
        sidebar.hide()
    }

    else {
        //Öffnen der Sidebar und Definition des Inhalts
        sidebar.setContent(`<button id="b1"><i class="fa-regular fa-circle-xmark" font-size="50px"></i></button> <br> <h1>${e.target.feature.properties.preferred_term} (${(parseFloat((e.target.feature.properties.Renewables_and_biofuels).replace(',', '.'))).toFixed(1)} %)</h1><br>
        <hr class="Strich_Sidebar"><p><p style="font-size:18px;">Energieform (Anteile in %)</h2><div id="Diagramm"></div><br><hr><br></p><p><div id="Tabelle"></div></p><p style="font-size: 12px;">*Anteil der Kategorie am gesamten Bruttoendenergieverbrauch</p> <br><br> <p><b>Quelle: </b><i>EUROSTAT (Stand 2021)</i><br><a href="https://ec.europa.eu/eurostat/databrowser/view/nrg_ind_rftce/default/table?lang=en&category=nrg.nrg_quant.nrg_quanta.nrg_ind_share" target="_blanc">Link zum Datensatz</a></p>`).show();

        //Erzeugung des Buttons zum Schließen
        document.getElementById('b1').addEventListener('click', function () {
            sidebar.hide();
        })


        //Variablen um Werte aus GeoJSON abzugreifen (bzw. aus dem Feature, welches angeklickt wurde) - da String, Umwandlung in Nummer notwendig!
        let Biomasse = parseFloat((e.target.feature.properties.Sustainable_primary_solid_biofuels).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Charcoal).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Sustainable_biofuels).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Sustainable_bioliquids).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Sustainable_biogases).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Renewable_municipal_waste).replace(',', '.'));

        let Wasserkraft = parseFloat((e.target.feature.properties.Hydro).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Tide_wave_ocean).replace(',', '.'));

        let Wind = parseFloat((e.target.feature.properties.Wind).replace(',', '.'));
        let Geothermie = parseFloat((e.target.feature.properties.Geothermal).replace(',', '.'));

        let Sonnenenergie = parseFloat((e.target.feature.properties.Solar_thermal).replace(',', '.'))
            + parseFloat((e.target.feature.properties.Solar_photovoltaic).replace(',', '.'));

        let Wärmepumpen = parseFloat((e.target.feature.properties.Ambient_heat_heat_pumps).replace(',', '.'))
        let erneuerbare_Kuehlung = parseFloat((e.target.feature.properties.Renewable_cooling).replace(',', '.'))



        //Anlegen des Arrays, welcher dann für die Diagrammerstellung notwendig ist und an drawChart übergeben wird
        let tabellenbezeichnung = ['Biomasse', 'Wasserkraft', 'Wind', 'Geothermie', 'Solarenergie', 'Wärmepumpen', 'erneuerbare Kühlung']
        let tabellenwerte = [parseFloat(Biomasse.toFixed(1)), parseFloat(Wasserkraft.toFixed(1)), parseFloat(Wind.toFixed(1)), parseFloat(Geothermie.toFixed(1)), parseFloat(Sonnenenergie.toFixed(1)), parseFloat(Wärmepumpen.toFixed(1)), parseFloat(erneuerbare_Kuehlung.toFixed(1))]

        let diagrammdaten = []

        for (let a = 0; a < tabellenwerte.length; a++) {
            diagrammdaten[a] = [tabellenbezeichnung[a], tabellenwerte[a]]
        }

        //Erstellung der einzelnen Diagramme

        //PIECHART
        google.charts.load('current', { packages: ['corechart'] });
        google.charts.setOnLoadCallback(function () {
            drawChart(diagrammdaten)
        });

        //TABELLE
        google.charts.load('current', { 'packages': ['table'] });
        google.charts.setOnLoadCallback(function () {
            drawTable(diagrammdaten);

        });
    }
}


//Funktion für Erstellung eines Google-Chart Diagramms 

function drawChart(diagrammdaten) {
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Energietyp')
    data.addColumn('number', 'Prozentzahl')
    data.addRows(diagrammdaten)

    var options = {
        pieHole: 0.4,
        slices: { 0: { color: '#b0a48e' }, 1: { color: '#8AA2D1' }, 2: { color: '#65C8CF' }, 3: { color: '#C59E74' }, 4: { color: '#D0D07B' }, 5: { color: '#DE7080' }, 6: { color: '#B374CA' } },
        backgroundColor: 'white',
        width: "60%",
        height: "60%",
        legend: { position: 'bottom' },
        pieSliceTextStyle: {
            color: 'black',
        }

    };

    var chart = new google.visualization.PieChart(document.getElementById('Diagramm'));
    chart.draw(data, options);
}





//Funktion für Erstellung einer Google-Chart Tabelle

function drawTable(diagrammdaten) {
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Energietyp');
    data.addColumn('number', 'Absoluter Wert (%)*');
    data.addRows(diagrammdaten);

    var table_style = {
        'headerRow': 'header-row',
        'hoverTableRow': 'hover-table-row',
    }

    var options = {
        'cssClassNames': table_style,
        showRowNumber: true, width: '100%', height: '100%'
    };




    var table = new google.visualization.Table(document.getElementById('Tabelle'));

    table.draw(data, options);

    console.log(diagrammdaten)
}

