import * as React from 'react';
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 560,
    padding: '10px',
    backgroundColor: '#fdfdff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px'
  },
});

const tooltipData = {
  "Cold Chain Product": {
    description: 
      "Distribusi Produk Rantai Dingin, termasuk Vaksin dan Produk Biologi lainnya.",
    source: "List Data Sertifikat CDOB, https://sertifikasicdob.pom.go.id/sertif/sertifikatgabungan.php",
  },
  "Obat Lain": {
    description: 
      "Distribusi Produk obat lainnya kecuali produk narkotika dan cold chain product.",
    source: "List Data Sertifikat CDOB, https://sertifikasicdob.pom.go.id/sertif/sertifikatgabungan.php",
  },
  "Jamu": {
    description:
      "Jamu adalah obat tradisional yang dibuat di Indonesia",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Obat Herbal Terstandar": {
    description:
      "Obat Herbal Terstandar adalah obat tradisional yang telah dibuktikan keamanan dan khasiatnya secara ilmiah dengan uji praklinik dan bahan bakunya telah distandardisasi",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Fitofarmaka": {
    description:
     "Fitofarmaka adalah obat tradisional yang telah dibuktikan keamanan dan khasiatnya secara ilmiah dengan uji praklinik dan uji klinik, bahan baku dan produk jadinya telah di standarisasi. ",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Cairan Obat Dalam": {
    description:
      "Cairan Obat Dalam adalah sediaan obat tradisional berupa minyak, larutan, suspensi, atau emulsi, terbuat dari Serbuk Simplisia dan/atau ekstrak dan digunakan sebagai obat dalam.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Rajangan": {
    description:
      "Rajangan adalah sediaan obat tradisional berupa satu jenis atau campuran beberapa jenis simplisia, yang cara penggunaannya dilakukan dengan pendidihan atau penyeduhan dengan air panas.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Serbuk": {
    description:
      "Serbuk adalah sediaan obat tradisional berupa butiran homogen dengan derajat halus yang sesuai, terbuat dari simplisia atau campuran dengan ekstrak yang cara penggunaannya diseduh dengan air panas.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Serbuk Instan": {
    description:
      "Serbuk Instan adalah sediaan obat tradisional berupa butiran homogen dengan derajat halus yang sesuai, terbuat dari ekstrak yang cara penggunaannya diseduh dengan air panas atau dilarutkan dalam air dingin.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Efervesen": {
    description:
      "Efervesen adalah sediaan padat obat tradisional, terbuat dari ekstrak dan/atau simplisia tertentu, mengandung natrium bikarbonat dan asam organik yang menghasilkan gelembung gas saat dimasukkan ke dalam air.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Pil": {
    description:
      "Pil adalah sediaan padat obat tradisional berupa massa bulat, terbuat dari serbuk simplisia dan/atau ekstrak.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Kapsul": {
    description:
      "Kapsul adalah sediaan obat tradisional yang terbungkus cangkang keras.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Kapsul Lunak": {
    description:
      "Kapsul Lunak adalah sediaan obat tradisional yang terbungkus cangkang lunak.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Tablet/Kaplet": {
    description:
      "Tablet/Kaplet adalah sediaan obat tradisional padat kompak, dibuat secara kempa cetak, dalam bentuk tabung pipih, silindris, atau bentuk lain, kedua permukaannya rata atau cembung.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Granul": {
    description:
      "Granul adalah sediaan obat tradisional berupa butiran terbuat dari ekstrak yang telah melalui proses granulasi yang cara penggunaannya diseduh dengan air panas atau dilarutkan dalam air dingin.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Pastiles": {
    description:
      "Pastiles adalah sediaan padat obat tradisional berupa lempengan pipih, umumnya berbentuk segi empat, terbuat dari serbuk simplisia dan/atau ekstrak.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Dodol/Jenang": {
    description:
      "Dodol/Jenang adalah sediaan padat obat tradisional dengan konsistensi lunak tetapi liat, terbuat dari serbuk simplisia dan/atau ekstrak.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Film Strip": {
    description:
      "Film Strip adalah sediaan padat obat tradisional berbentuk lembaran tipis yang digunakan secara oral.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Cairan Obat Luar": {
    description:
      "Cairan Obat Luar adalah sediaan obat tradisional berupa minyak, larutan, suspensi, atau emulsi, terbuat dari simplisia dan/atau ekstrak dan digunakan sebagai obat luar.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Losio": {
    description:
      "Losio adalah sediaan cairan obat tradisional mengandung Serbuk Simplisia, Eksudat, Ekstrak, dan/atau minyak yang terlarut atau terdispersi berupa suspensi atau emulsi dalam bahan dasar losio dan ditujukan untuk pemakaian topikal pada kulit.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Parem": {
    description:
      "Parem adalah sediaan padat atau cair obat tradisional, terbuat dari serbuk simplisia dan/atau ekstrak dan digunakan sebagai obat luar.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Salep": {
    description:
      "Salep adalah sediaan obat tradisional setengah padat terbuat dari ekstrak yang larut atau terdispersi homogen dalam dasar salep yang sesuai dan ditujukan untuk pemakaian topikal pada kulit.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Krim": {
    description:
      "Krim adalah sediaan obat tradisional setengah padat mengandung satu atau lebih ekstrak terlarut atau terdispersi dalam bahan dasar krim yang sesuai dan ditujukan untuk pemakaian topikal pada kulit.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Gel": {
    description:
      "Gel adalah sediaan obat tradisional setengah padat mengandung satu atau lebih ekstrak dan/atau minyak yang terlarut atau terdispersi dalam bahan dasar gel dan ditujukan untuk pemakaian topikal pada kulit.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Serbuk Obat Luar": {
    description:
      "Serbuk Obat Luar adalah sediaan obat tradisional berupa butiran homogen dengan derajat halus yang sesuai, terbuat dari simplisia atau campuran dengan ekstrak yang cara penggunaannya dicampur dengan bahan cair (minyak/air) yang sesuai dan digunakan sebagai obat luar kecuali luka terbuka.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Tapel": {
    description:
      "Tapel adalah sediaan padat obat tradisional, terbuat dari serbuk simplisia dan/atau ekstrak dan digunakan sebagai obat luar yang digunakan di perut.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Pilis": {
    description:
      "Pilis adalah sediaan padat obat tradisional, terbuat dari serbuk simplisia dan/atau ekstrak dan digunakan sebagai obat luar yang digunakan di dahi dan di pelipis.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Plester/Koyok": {
    description:
      "Plester/Koyok adalah sediaan obat tradisional terbuat dari bahan yang dapat melekat pada kulit dan tahan air yang dapat berisi serbuk simplisia dan/atau ekstrak, digunakan sebagai obat luar dan cara penggunaannya ditempelkan pada kulit.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Supositoria untuk Wasir": {
    description:
      "Supositoria untuk wasir adalah sediaan padat obat tradisional, terbuat dari ekstrak yang larut atau terdispersi homogen dalam dasar supositoria yang sesuai, umumnya meleleh, melunak, atau melarut pada suhu tubuh dan cara penggunaannya melalui rektal.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
  "Rajangan Obat Luar": {
    description:
      "Rajangan Obat Luar adalah sediaan obat tradisional berupa satu jenis Simplisia atau campuran beberapa jenis Simplisia, yang digunakan untuk obat luar.",
    source: "Modul Cerdas Memilih dan Menggunakan Obat Tradisional yang Aman (BPOM, 2023)",
  },
};

const JenisSediaanTooltip = ({ jenisSediaan }) => {
  if(jenisSediaan === 'OHT'){
    jenisSediaan = 'Obat Herbal Terstandar'
  } else if(jenisSediaan === "CCP" || jenisSediaan === "Cold Chain Product (CCP)"){
    jenisSediaan = "Cold Chain Product"
  } else if(jenisSediaan === "ObatLain"){
    jenisSediaan = "Obat Lain"
  }
  const { description, source } = tooltipData[jenisSediaan] || {};
  
  if (!description) {
    return null;
  }

  return (
    <CustomTooltip
      title={
        <React.Fragment>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1, 
              color: "1B1C1E",
              fontFamily: 'Instrument Sans, sans-serif'}}>
            {jenisSediaan}
          </Typography>
          <Typography 
            variant="body2"  
            sx={{ 
              mb: 1, 
              color: "A6A6A6",
              fontFamily: 'Instrument Sans, sans-serif'}}
            >{description}</Typography>
          <Typography 
            sx={{ 
              fontStyle: 'italic', 
              mb: 1, 
              fontSize: '12px',
              color: "1B1C1E",
              fontFamily: 'Instrument Sans, sans-serif'}}
            >Source: {source}</Typography>
        </React.Fragment>
      }
    >
      <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        <i 
          class="fa-solid fa-circle-info"
          style={{ color: '#868a90', marginLeft: '10px', fontSize: '18px' }}
        ></i>
      </span>
    </CustomTooltip>
  );
};

export default JenisSediaanTooltip;
