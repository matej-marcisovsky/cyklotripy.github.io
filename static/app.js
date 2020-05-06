const point = SMap.Coords.fromWGS84(14.41, 50.08);
const map = new SMap(document.getElementById('map'), point, 10);

map.addDefaultLayer(SMap.DEF_BASE).enable();
map.addDefaultControls();
