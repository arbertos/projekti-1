// ============================================================
// 1. HAETAAN HTML-ELEMENTIT
// ============================================================
const lomake = document.getElementById("treeni-lomake");
const pvmKentta = document.getElementById("pvm");
const lajiKentta = document.getElementById("laji");
const kestoKentta = document.getElementById("kesto");
const muistiinpanotKentta = document.getElementById("muistiinpanot");
const rasitusKentta = document.getElementById("rasitus-kentta");

const lista = document.getElementById("treeni-lista");
const tyhjaViesti = document.getElementById("tyhja-viesti");
const suodatin = document.getElementById("suodatin");

const kokonaisaikaTeksti = document.getElementById("kokonaisaika");
const pylvaat = document.getElementById("pylvaat");
const yhteenvetoNappi = document.getElementById("yhteenveto-nappi");
const yhteenvetoSisalto = document.getElementById("yhteenveto-sisalto");

const viikkoOtsikko = document.getElementById("viikko-otsikko");
const edellinenNappi = document.getElementById("edellinen-viikko");
const seuraavaNappi = document.getElementById("seuraava-viikko");


// ============================================================
// 2. TALLENNUS (localStorage)
// ============================================================
// Haetaan tallennetut treenit. Jos niitä ei ole, aloitetaan tyhjällä taulukolla.
// localStorage tallentaa vain tekstiä, joten JSON.parse muuttaa tekstin taulukoksi.
let treenit = JSON.parse(localStorage.getItem("treenit")) || [];

function tallenna() {
  // JSON.stringify muuttaa taulukon tekstiksi tallennusta varten
  localStorage.setItem("treenit", JSON.stringify(treenit));
}


// ============================================================
// 3. APUFUNKTIOT
// ============================================================

// Muuttaa minuutit luettavaan muotoon, esim. 135 -> "2 h 15 min"
function muotoileAika(minuutit) {
  const tunnit = Math.floor(minuutit / 60);
  const loput = minuutit % 60;

  if (tunnit === 0) return loput + " min";
  if (loput === 0) return tunnit + " h";
  return tunnit + " h " + loput + " min";
}

// Muuttaa päivämäärän "2026-10-19" muotoon "ma 19.10."
function muotoilePvm(pvm) {
  const paiva = new Date(pvm + "T00:00");
  const viikonpaivat = ["su", "ma", "ti", "ke", "to", "pe", "la"];
  return viikonpaivat[paiva.getDay()] + " " + paiva.getDate() + "." + (paiva.getMonth() + 1) + ".";
}

// Muuttaa Date-olion muotoon "2026-10-21" (sama muoto kuin date-kentässä)
function pvmTekstiksi(pvm) {
  const kuukausi = String(pvm.getMonth() + 1).padStart(2, "0");
  const paiva = String(pvm.getDate()).padStart(2, "0");
  return pvm.getFullYear() + "-" + kuukausi + "-" + paiva;
}

// Palauttaa tämän päivän muodossa "2026-10-21"
function tanaan() {
  return pvmTekstiksi(new Date());
}


// ============================================================
// 3b. VIIKOT
// ============================================================

// Palauttaa annetun päivän viikon maanantain
function viikonMaanantai(pvm) {
  const maanantai = new Date(pvm);
  // getDay(): su = 0, ma = 1 ... la = 6. Lasketaan montako päivää on kulunut maanantaista.
  const paiviaMaanantaista = (maanantai.getDay() + 6) % 7;
  maanantai.setDate(maanantai.getDate() - paiviaMaanantaista);
  maanantai.setHours(0, 0, 0, 0);
  return maanantai;
}

// Laskee viikkonumeron (Suomessa käytetty ISO-viikko: viikko, jolla on vuoden ensimmäinen torstai, on viikko 1)
function viikkonumero(pvm) {
  const torstai = viikonMaanantai(pvm);
  torstai.setDate(torstai.getDate() + 3);
  const vuodenAlku = new Date(torstai.getFullYear(), 0, 1);
  const paivia = Math.round((torstai - vuodenAlku) / (24 * 60 * 60 * 1000));
  return Math.floor(paivia / 7) + 1;
}

// Näytettävän viikon maanantai. Aluksi kuluva viikko.
let valittuViikko = viikonMaanantai(new Date());

// Palauttaa vain valitun viikon treenit (maanantaista sunnuntaihin)
function viikonTreenit() {
  const sunnuntai = new Date(valittuViikko);
  sunnuntai.setDate(sunnuntai.getDate() + 6);

  const alku = pvmTekstiksi(valittuViikko);
  const loppu = pvmTekstiksi(sunnuntai);

  // Päivämäärät ovat muotoa "2026-10-21"
  return treenit.filter(function (treeni) {
    return treeni.pvm >= alku && treeni.pvm <= loppu;
  });
}

// Päivittää otsikon, esim.
function piirraViikkoOtsikko() {
  const sunnuntai = new Date(valittuViikko);
  sunnuntai.setDate(sunnuntai.getDate() + 6);

  viikkoOtsikko.textContent =
    "Viikko " + viikkonumero(valittuViikko) + " · " +
    valittuViikko.getDate() + "." + (valittuViikko.getMonth() + 1) + ".–" +
    sunnuntai.getDate() + "." + (sunnuntai.getMonth() + 1) + "." + sunnuntai.getFullYear();

  // Tulevaisuuteen ei voi siirtyä.
  const kuluvaViikko = viikonMaanantai(new Date());
  seuraavaNappi.disabled = valittuViikko.getTime() >= kuluvaViikko.getTime();
}

function vaihdaViikkoa(muutos) {
  valittuViikko.setDate(valittuViikko.getDate() + muutos * 7);
  paivitaNakyma();
}


// ============================================================
// 4. LOMAKKEEN TARKISTUS
// ============================================================

// Näyttää virheilmoituksen ja lisää kenttään punaisen reunan
function naytaVirhe(kentta, virheId, viesti) {
  kentta.classList.add("virheellinen");
  document.getElementById(virheId).textContent = viesti;
}

// Poistaa virheilmoituksen ja punaisen reunan
function poistaVirhe(kentta, virheId) {
  kentta.classList.remove("virheellinen");
  document.getElementById(virheId).textContent = "";
}

// Tarkistaa kentät. Palauttaa true, jos kaikki on kunnossa.
function tarkistaLomake() {
  let kunnossa = true;

  // Päivämäärä: ei tyhjä eikä tulevaisuudessa
  if (pvmKentta.value === "") {
    naytaVirhe(pvmKentta, "pvm-virhe", "Valitse päivämäärä.");
    kunnossa = false;
  } else if (pvmKentta.value > tanaan()) {
    naytaVirhe(pvmKentta, "pvm-virhe", "Päivämäärä ei voi olla tulevaisuudessa.");
    kunnossa = false;
  } else {
    poistaVirhe(pvmKentta, "pvm-virhe");
  }

  // Laji: jokin pitää olla valittuna
  if (lajiKentta.value === "") {
    naytaVirhe(lajiKentta, "laji-virhe", "Valitse laji.");
    kunnossa = false;
  } else {
    poistaVirhe(lajiKentta, "laji-virhe");
  }

  // Kesto: kokonaisluku välillä 1–600
  const kesto = Number(kestoKentta.value);
  if (kestoKentta.value === "") {
    naytaVirhe(kestoKentta, "kesto-virhe", "Anna treenin kesto.");
    kunnossa = false;
  } else if (!Number.isInteger(kesto) || kesto < 1 || kesto > 600) {
    naytaVirhe(kestoKentta, "kesto-virhe", "Keston pitää olla kokonaisluku väliltä 1–600 minuuttia.");
    kunnossa = false;
  } else {
    poistaVirhe(kestoKentta, "kesto-virhe");
  }

  // Rasitus: jokin valinta pitää olla valittuna
  const valittuRasitus = document.querySelector('input[name="rasitus"]:checked');
  if (valittuRasitus === null) {
    naytaVirhe(rasitusKentta, "rasitus-virhe", "Valitse rasitustaso.");
    kunnossa = false;
  } else {
    poistaVirhe(rasitusKentta, "rasitus-virhe");
  }

  // Muistiinpanot: vapaaehtoinen, mutta enintään 100 merkkiä
  if (muistiinpanotKentta.value.trim().length > 100) {
    naytaVirhe(muistiinpanotKentta, "muistiinpanot-virhe", "Muistiinpanot saa olla enintään 100 merkkiä.");
    kunnossa = false;
  } else {
    poistaVirhe(muistiinpanotKentta, "muistiinpanot-virhe");
  }

  return kunnossa;
}


// ============================================================
// 5. TREENIN LISÄÄMINEN JA POISTAMINEN
// ============================================================
lomake.addEventListener("submit", function (tapahtuma) {
  // Estetään sivun uudelleenlataus, joka on lomakkeen oletustoiminto
  tapahtuma.preventDefault();

  if (!tarkistaLomake()) return;

  // Luodaan uusi treeni-olio lomakkeen tiedoista
  const treeni = {
    id: Date.now(), // yksilöllinen tunniste poistamista varten
    pvm: pvmKentta.value,
    laji: lajiKentta.value,
    kesto: Number(kestoKentta.value),
    rasitus: document.querySelector('input[name="rasitus"]:checked').value,
    muistiinpanot: muistiinpanotKentta.value.trim()
  };

  treenit.push(treeni);
  tallenna();

  // Siirrytään sen viikon näkymään, jolle treeni lisättiin
  valittuViikko = viikonMaanantai(new Date(treeni.pvm + "T00:00"));

  lomake.reset();
  pvmKentta.value = tanaan();
  paivitaNakyma();
});

// Kun käyttäjä korjaa kenttää, virheilmoitus poistuu heti
lomake.addEventListener("input", function (tapahtuma) {
  const kentta = tapahtuma.target;
  if (kentta.name === "rasitus") {
    poistaVirhe(rasitusKentta, "rasitus-virhe");
  } else {
    poistaVirhe(kentta, kentta.id + "-virhe");
  }
});

function poistaTreeni(id) {
  // Pidetään kaikki muut treenit paitsi se, jonka id täsmää
  treenit = treenit.filter(function (treeni) {
    return treeni.id !== id;
  });
  tallenna();
  paivitaNakyma();
}


// ============================================================
// 6. LISTAN PIIRTÄMINEN (DOM)
// ============================================================
function piirraLista() {
  lista.innerHTML = ""; // tyhjennetään vanha lista

  // Otetaan valitun viikon treenit, suodatetaan lajin mukaan ja järjestetään uusin ensin
  const valittuLaji = suodatin.value;
  const viikolla = viikonTreenit();
  const naytettavat = viikolla
    .filter(function (treeni) {
      return valittuLaji === "Kaikki" || treeni.laji === valittuLaji;
    })
    .sort(function (a, b) {
      return b.pvm.localeCompare(a.pvm);
    });

  naytettavat.forEach(function (treeni) {
    const rivi = document.createElement("li");
    rivi.className = "treeni rasitus-" + treeni.rasitus.toLowerCase();

    const tiedot = document.createElement("div");
    tiedot.className = "treeni-tiedot";

    const otsikko = document.createElement("strong");
    otsikko.textContent = muotoilePvm(treeni.pvm) + " " + treeni.laji;

    const lisatiedot = document.createElement("span");
    lisatiedot.textContent = muotoileAika(treeni.kesto) + " · " + treeni.rasitus;

    tiedot.append(otsikko, lisatiedot);

    // Kuvaus näytetään vain, jos sellainen on kirjoitettu
    if (treeni.muistiinpanot !== "") {
      const muistiinpanot = document.createElement("small");
      muistiinpanot.textContent = treeni.muistiinpanot;
      tiedot.append(muistiinpanot);
    }

    const poistaNappi = document.createElement("button");
    poistaNappi.className = "poista-nappi";
    poistaNappi.textContent = "Poista";
    poistaNappi.addEventListener("click", function () {
      poistaTreeni(treeni.id);
    });

    rivi.append(tiedot, poistaNappi);
    lista.append(rivi);
  });

  // Näytetään viesti, jos listassa ei ole mitään
  if (naytettavat.length === 0) {
    tyhjaViesti.textContent = viikolla.length === 0
      ? "Ei kirjattuja treenejä tällä viikolla."
      : "Ei treenejä valitulla lajilla tällä viikolla.";
    tyhjaViesti.classList.remove("piilossa");
  } else {
    tyhjaViesti.classList.add("piilossa");
  }
}


// ============================================================
// 7. YHTEENVETO JA PYLVÄÄT
// ============================================================
function piirraYhteenveto() {
  const viikolla = viikonTreenit();

  // Lasketaan viikon treenien minuutit yhteen
  let yhteensa = 0;
  viikolla.forEach(function (treeni) {
    yhteensa += treeni.kesto;
  });

  kokonaisaikaTeksti.textContent = muotoileAika(yhteensa) + " (" + viikolla.length + " treeniä)";

  // Lasketaan minuutit lajeittain, esim. { Juoksu: 90, Kuntosali: 60 }
  const lajeittain = {};
  viikolla.forEach(function (treeni) {
    if (lajeittain[treeni.laji] === undefined) {
      lajeittain[treeni.laji] = 0;
    }
    lajeittain[treeni.laji] += treeni.kesto;
  });

  // Järjestetään lajit eniten treenatusta vähiten treenattuun
  const lajit = Object.keys(lajeittain).sort(function (a, b) {
    return lajeittain[b] - lajeittain[a];
  });

  pylvaat.innerHTML = "";

  lajit.forEach(function (laji) {
    const minuutit = lajeittain[laji];
    const prosentti = Math.round((minuutit / yhteensa) * 100);

    const rivi = document.createElement("div");
    rivi.className = "pylvas-rivi";

    const nimi = document.createElement("span");
    nimi.textContent = laji;

    const tausta = document.createElement("div");
    tausta.className = "pylvas-tausta";

    const tayte = document.createElement("div");
    tayte.className = "pylvas-tayte";
    tayte.style.width = prosentti + "%"; // pylvään pituus = prosenttiosuus

    tausta.append(tayte);

    const arvo = document.createElement("span");
    arvo.className = "pylvas-arvo";
    arvo.textContent = muotoileAika(minuutit) + " · " + prosentti + " %";

    rivi.append(nimi, tausta, arvo);
    pylvaat.append(rivi);
  });
}


// ============================================================
// 8. PIILOTUS JA SUODATUS
// ============================================================
yhteenvetoNappi.addEventListener("click", function () {
  yhteenvetoSisalto.classList.toggle("piilossa");

  if (yhteenvetoSisalto.classList.contains("piilossa")) {
    yhteenvetoNappi.textContent = "Näytä";
  } else {
    yhteenvetoNappi.textContent = "Piilota";
  }
});

suodatin.addEventListener("change", piirraLista);

edellinenNappi.addEventListener("click", function () {
  vaihdaViikkoa(-1);
});

seuraavaNappi.addEventListener("click", function () {
  vaihdaViikkoa(1);
});


// ============================================================
// 9. KÄYNNISTYS
// ============================================================
function paivitaNakyma() {
  piirraViikkoOtsikko();
  piirraLista();
  piirraYhteenveto();
}

// ============================================================
// 10. TUMMA TILA
// ============================================================
const darkmodeNappi = document.getElementById("darkmode-nappi");

function asetaTeema(tumma) {
  // toggle(luokka, true) lisää luokan, toggle(luokka, false) poistaa sen
  document.body.classList.toggle("tumma", tumma);
  darkmodeNappi.textContent = tumma ? "☀️ Vaalea tila" : "🌙 Tumma tila";
  localStorage.setItem("teema", tumma ? "tumma" : "vaalea");
}

darkmodeNappi.addEventListener("click", function () {
  asetaTeema(!document.body.classList.contains("tumma"));
});

// Käytetään tallennettua teemaa sivun latautuessa
asetaTeema(localStorage.getItem("teema") === "tumma");

pvmKentta.value = tanaan();  // oletuksena tämä päivä
pvmKentta.max = tanaan();    // kalenterissa ei voi valita tulevaa päivää
paivitaNakyma();