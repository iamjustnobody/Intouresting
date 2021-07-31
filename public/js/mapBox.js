
export function displayMap(locations){
        mapboxgl.accessToken = 'pk.eyJ1Ijoibm9ub2Fpbm9ubyIsImEiOiJja21pN2RpOXgwZWdmMndtdGFzdmV5N3ZqIn0.k8SjMZQIP7zP31eZGCNaYw';
        var map = new mapboxgl.Map({
            container: 'map',  //element map in pug html
            style: 'mapbox://styles/nonoainono/ckmi8lbo32mhs17ny35538dh2',
        });

        const bounds=new mapboxgl.LngLatBounds();
        locations.forEach(loc=>{
            //create marker
            const el=document.createElement('div');
            el.className='marker';
            //add marker
            new mapboxgl.Marker({
                element:el,
                anchor:'bottom'
            }).setLngLat(loc.coordinates).addTo(map); 

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
