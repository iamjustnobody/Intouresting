/*
const locations=JSON.parse(document.getElementById('map').dataset.locations);
console.log(document.getElementById('map').dataset);
 */ //move to index. mjs now index.js

/*
<div id='map' style='width: 400px; height: 300px;'></div>
<script>
    mapboxgl.accessToken = 'pk.eyJ1Ijoibm9ub2Fpbm9ubyIsImEiOiJja21pN2RpOXgwZWdmMndtdGFzdmV5N3ZqIn0.k8SjMZQIP7zP31eZGCNaYw';
    var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
});
</script>
 */
/*
mapboxgl.accessToken = 'pk.eyJ1Ijoibm9ub2Fpbm9ubyIsImEiOiJja21pN2RpOXgwZWdmMndtdGFzdmV5N3ZqIn0.k8SjMZQIP7zP31eZGCNaYw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/nonoainono/ckmi8lbo32mhs17ny35538dh2',//'mapbox://styles/nonoainono/ckmi86zpl3ncx17mkshqsmgvf',  //'mapbox://styles/mapbox/streets-v11'
    //   center:[-118.113491,34.111745], //lng,lat
 //   zoom:4,
 //   interactive:false
 //   scrollZoom:false
});

const bounds=new mapboxgl.LngLatBounds();//bounds are areas displayed //now extended with all locations in the locations array
locations.forEach(loc=>{
    //create marker
    const el=document.createElement('div');
    el.className='marker';
    //add marker
    new mapboxgl.Marker({
        element:el,
        anchor:'bottom'
    }).setLngLat(loc.coordinates).addTo(map); //new marker needs setting location/coordinates and then adding to the map

    //add pop up
    new mapboxgl.Popup({offset:30}).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);



    //extend bounds to include current location
    bounds.extend(loc.coordinates);
});
map.fitBounds(bounds,{//moving & zooming
    padding:{
        top:200,
        bottom: 150,
        left:100,
        right:100
    }
});*/
//become below now
//export const displayMap=(locations)=>{
export function displayMap(locations){
        mapboxgl.accessToken = 'pk.eyJ1Ijoibm9ub2Fpbm9ubyIsImEiOiJja21pN2RpOXgwZWdmMndtdGFzdmV5N3ZqIn0.k8SjMZQIP7zP31eZGCNaYw';
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/nonoainono/ckmi8lbo32mhs17ny35538dh2',//'mapbox://styles/nonoainono/ckmi86zpl3ncx17mkshqsmgvf',  //'mapbox://styles/mapbox/streets-v11'
            //   center:[-118.113491,34.111745], //lng,lat
            //   zoom:4,
            //   interactive:false
            //   scrollZoom:false
        });

        const bounds=new mapboxgl.LngLatBounds();//bounds are areas displayed //now extended with all locations in the locations array
        locations.forEach(loc=>{
            //create marker
            const el=document.createElement('div');
            el.className='marker';
            //add marker
            new mapboxgl.Marker({
                element:el,
                anchor:'bottom'
            }).setLngLat(loc.coordinates).addTo(map); //new marker needs setting location/coordinates and then adding to the map

            //add pop up
            new mapboxgl.Popup({offset:30}).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);



            //extend bounds to include current location
            bounds.extend(loc.coordinates);
        });
        map.fitBounds(bounds,{//moving & zooming
            padding:{
                top:200,
                bottom: 150,
                left:100,
                right:100
            }
        });
    }
