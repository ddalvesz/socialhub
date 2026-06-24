import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pynjnxqmhiwsrehhfxxx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bmpueHFtaGl3c3JlaGhmeHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMjI3NCwiZXhwIjoyMDk0Mjc4Mjc0fQ.hFXhW6sVvQac26g8tuavrGSPpk8_vdPK6wexg0XgM0U'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Parse "R$ 40.192,80" → 40192.80  |  "" | "#N/A" → null
function parseBRL(val) {
  if (!val || val === '#N/A' || val.trim() === '') return null
  const clean = val.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

// Parse "01/05/2026" → "2026-05-01"
function parseDate(val) {
  const [d, m, y] = val.split('/')
  return `${y}-${m}-${d}`
}

// Parse alcance: "1.721" → 1721 | "" → null
function parseAlcance(val) {
  if (!val || val.trim() === '' || val === '-') return null
  const n = parseInt(val.replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

// Today's date in YYYY-MM-DD (UTC-3 Brazil)
const today = '2026-06-09'

// Raw CSV rows
const rows = [
  { date:'01/05/2026', diaSemana:'sexta-feira',  cupomLigado:true,  criativo:'TEMPLATE COLEÇÃO SÓ TEM NO BRASIL',         merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'SEXTATOP',      receita1:'R$ 40,192.80', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 40,192.80', receitaUtm:'R$ 12,862.25', alcance:'1.721', utmCampaign:'live_20260501', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260501' },
  { date:'02/05/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'TEMPLATE VÍDEO PLAY',                        merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'20HOJE',        receita1:'R$ 28,402.10', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 28,402.10', receitaUtm:'R$ 8,996.86',  alcance:'761',   utmCampaign:'live_20260502', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260502' },
  { date:'03/05/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'TEMPLATE DUPLO DROP FITNESS',                merchan1:'DESCONTO + MIMO',                             nominal1:'MIMOTOP',       receita1:'R$ 24,888.39', merchan2:'FRETE GRÁTIS + MIMO', nominal2:'MIMOFRETE', receita2:'R$ 10,483.70', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 35,372.09', receitaUtm:'R$ 17,282.58', alcance:'-', utmCampaign:'live_20260503', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260503' },
  { date:'04/05/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'TEMPLATE COLEÇÃO SÓ TEM NO BRASIL',         merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'STORY10',       receita1:'R$ 44,239.17', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 44,239.17', receitaUtm:'R$ 20,058.82', alcance:'656',   utmCampaign:'live_20260504', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260504' },
  { date:'05/05/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'TEMPLATE EXCLUSIVO 5.5',                    merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'PROMO5',        receita1:'R$ 40,384.34', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 40,384.34', receitaUtm:'R$ 20,556.85', alcance:'1.341', utmCampaign:'live_20260505', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260505' },
  { date:'06/05/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'TEMPLATE MALA BOLD',                        merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'LIVETOP',       receita1:'R$ 24,439.22', merchan2:'10% OFF EM COMPRAS A PARTIR DE R$99', nominal2:'10HOJE', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 24,439.22', receitaUtm:'R$ 12,592.71', alcance:'2.144', utmCampaign:'live_20260506', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260506' },
  { date:'07/05/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'TEMPLATE TOP VÍDEOS PLAY',                  merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'LIVE20',        receita1:'R$ 35,447.97', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 35,447.97', receitaUtm:'R$ 12,021.85', alcance:'1.532', utmCampaign:'live_20260507', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260507' },
  { date:'08/05/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'FRETE GRÁTIS + 3X SEM JUROS',                nominal1:'SEXTA3X',       receita1:'R$ 10,672.00', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 10,672.00', receitaUtm:'R$ 7,819.90',  alcance:'1.477', utmCampaign:'live_20260508', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260508' },
  { date:'09/05/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'MEGAPROMO',     receita1:'R$ 27,866.70', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 27,866.70', receitaUtm:'R$ 17,226.74', alcance:'1.729', utmCampaign:'live_20260509', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260509' },
  { date:'10/05/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'20AGORA',       receita1:'R$ 28,803.23', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 28,803.23', receitaUtm:'R$ 15,788.08', alcance:'1.452', utmCampaign:'live_20260510', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260510' },
  { date:'11/05/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'TEMPLATE PADRÃO MALA BOLD',                 merchan1:'DESCONTO + MIMO',                             nominal1:'LIBERADO',      receita1:'R$ 13,157.80', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 13,157.80', receitaUtm:'R$ 17,281.57', alcance:'1.635', utmCampaign:'live_20260511', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260511' },
  { date:'12/05/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'TEMPLATE VÍDEO SÓ TEM NO BRASIL',           merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'TERCAOFF',      receita1:'R$ 33,075.87', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 33,075.87', receitaUtm:'R$ 16,775.46', alcance:'1.388', utmCampaign:'live_20260512', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260512' },
  { date:'13/05/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'TEMPLATE VÍDEO SÓ TEM NO BRASIL',           merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'QUARTAOFF',     receita1:'R$ 15,744.75', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 15,744.75', receitaUtm:'R$ 11,102.82', alcance:'',      utmCampaign:'live_20260513', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260513' },
  { date:'14/05/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'TEMPLATE TRIPLO MALA BOLD',                 merchan1:'DESCONTO + FRETE GRÁTIS + MIMO',             nominal1:'TRIPLOMIMO',    receita1:'R$ 15,358.69', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 15,358.69', receitaUtm:'R$ 11,745.86', alcance:'',      utmCampaign:'live_20260514', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260514' },
  { date:'15/05/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'SEXTA20',       receita1:'R$ 10,305.90', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 10,305.90', receitaUtm:'R$ 4,135.21',  alcance:'',      utmCampaign:'live_20260515', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260515' },
  { date:'16/05/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'TEMPLATE DUPLO DROP FITNESS',                merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'DESCONTO3X',    receita1:'R$ 11,579.00', merchan2:'3X SEM JUROS + MIMO', nominal2:'MIMO3X', receita2:'R$ 3,365.80', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 14,944.80', receitaUtm:'R$ 11,533.13', alcance:'', utmCampaign:'live_20260516', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260516' },
  { date:'17/05/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'TEMPLATE VÍDEO SÓ TEM NO BRASIL',           merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'DOMINGO10',     receita1:'R$ 38,556.76', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 38,556.76', receitaUtm:'R$ 20,938.84', alcance:'',      utmCampaign:'live_20260517', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260517' },
  { date:'18/05/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'',                                          merchan1:'FRETE GRÁTIS + 3X SEM JUROS',                nominal1:'LIVEGRATIS',    receita1:'R$ 5,166.30',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'COPA26', receitaExtra:'R$ 2,805.01', receitaTotal:'R$ 7,971.31', receitaUtm:'R$ 2,492.30', alcance:'', utmCampaign:'live_20260518', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260518' },
  { date:'19/05/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'TEMPLATE TRIPO + COLEÇÃO SÓ TEM NO BRASIL', merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'TRIPLOTERCA',   receita1:'R$ 13,872.03', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 13,872.03', receitaUtm:'R$ 10,395.41', alcance:'', utmCampaign:'live_20260519', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260519' },
  { date:'20/05/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'TEMPLATE PADRÃO',                           merchan1:'3X SEM JUROS + MIMO',                        nominal1:'INSTATOP',      receita1:'R$ 8,765.30',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 8,765.30',  receitaUtm:'R$ 9,933.84',  alcance:'',      utmCampaign:'live_20260520', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260520' },
  { date:'21/05/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'TEMPLATE VÍDEO TOTE POP',                   merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'QUINTAOFF',     receita1:'R$ 954.31',    merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 954.31',    receitaUtm:'R$ 7,376.53',  alcance:'',      utmCampaign:'live_20260521', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260521' },
  { date:'22/05/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'INSTAPROMO',    receita1:'',             merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 0,00',      receitaUtm:'',             alcance:'',      utmCampaign:'live_20260522', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260522' },
  { date:'23/05/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'20PROMO',       receita1:'R$ 8,834.10',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 8,834.10',  receitaUtm:'R$ 7,929.05',  alcance:'',      utmCampaign:'live_20260523', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260523' },
  { date:'24/05/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'LIVE3X',        receita1:'R$ 14,095.62', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 14,095.62', receitaUtm:'R$ 14,138.09', alcance:'',      utmCampaign:'live_20260524', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260524' },
  { date:'25/05/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'',                                          merchan1:'FRETE GRÁTIS + MIMO',                        nominal1:'STORYMIMO',     receita1:'R$ 8,078.90',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 8,078.90',  receitaUtm:'R$ 11,862.16', alcance:'',      utmCampaign:'live_20260525', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260525' },
  { date:'26/05/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + MIMO',             nominal1:'MIMOAGORA',     receita1:'R$ 22,961.35', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 22,961.35', receitaUtm:'R$ 22,063.99', alcance:'',      utmCampaign:'live_20260526', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260526' },
  { date:'27/05/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'TEMPLATE PADRÃO',                           merchan1:'3X SEM JUROS + MIMO',                        nominal1:'QUARTAMIMO',    receita1:'R$ 4,622.80',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 4,622.80',  receitaUtm:'R$ 7,018.25',  alcance:'',      utmCampaign:'live_20260527', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260527' },
  { date:'28/05/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'TEMPLATE ESTÁTICO SÓ TEM NO BRASIL',        merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'LIVEOFF',       receita1:'R$ 11,033.66', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 11,033.66', receitaUtm:'R$ 10,118.69', alcance:'',      utmCampaign:'live_20260528', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260528' },
  { date:'29/05/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'LIVE10',        receita1:'R$ 22,987.67', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 22,987.67', receitaUtm:'R$ 8,315.73',  alcance:'',      utmCampaign:'live_20260529', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260529' },
  { date:'30/05/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'SABADOMEGA',    receita1:'R$ 20,700.45', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 20,700.45', receitaUtm:'R$ 11,087.30', alcance:'',      utmCampaign:'live_20260530', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260530' },
  { date:'31/05/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'HOJE20',        receita1:'R$ 34,273.60', merchan2:'', nominal2:'', receita2:'', cupomExtra:'CANAL10', receitaExtra:'R$ 2,961.44', receitaTotal:'R$ 37,235.04', receitaUtm:'R$ 17,468.74', alcance:'', utmCampaign:'live_20260531', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260531' },
  { date:'01/06/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'SUPERJUNHO',    receita1:'R$ 22,080.00', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 22,080.00', receitaUtm:'R$ 14,364.22', alcance:'',      utmCampaign:'live_20260601', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260601' },
  { date:'02/06/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'OFFTERCA',      receita1:'R$ 8,646.41',  merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 8,646.41',  receitaUtm:'R$ 9,644.43',  alcance:'',      utmCampaign:'live_20260602', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260602' },
  { date:'03/06/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + MIMO',             nominal1:'LIVEPROMO',     receita1:'R$ 14,620.83', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 14,620.83', receitaUtm:'R$ 9,759.60',  alcance:'',      utmCampaign:'live_20260603', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260603' },
  { date:'04/06/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'QUINTA20',      receita1:'R$ 37,405.66', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 37,405.66', receitaUtm:'R$ 16,312.91', alcance:'',      utmCampaign:'live_20260604', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260604' },
  { date:'05/06/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'10% OFF EM COMPRAS A PARTIR DE R$150',        nominal1:'SEXTAFREE',     receita1:'R$ 27,559.45', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 27,559.45', receitaUtm:'R$ 11,231.03', alcance:'',      utmCampaign:'live_20260605', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260605' },
  { date:'06/06/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'SABADOOFF',     receita1:'',             merchan2:'FRETE GRÁTIS + MIMO', nominal2:'SABADOMIMO', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 0,00', receitaUtm:'', alcance:'', utmCampaign:'live_20260606', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260606' },
  { date:'07/06/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'LIVETRIPLO',    receita1:'R$ 24,532.53', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 24,532.53', receitaUtm:'R$ 11,794.34', alcance:'',      utmCampaign:'live_20260607', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260607' },
  { date:'08/06/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'MIMOTOP',       receita1:'R$ 11,925.29', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 11,925.29', receitaUtm:'R$ 806.11',    alcance:'',      utmCampaign:'live_20260608', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260608' },
  { date:'09/06/2026', diaSemana:'terça-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'TERCAPROMO',    receita1:'',             merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'R$ 0,00',      receitaUtm:'',             alcance:'',      utmCampaign:'live_20260609', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260609' },
  { date:'10/06/2026', diaSemana:'quarta-feira',  cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'QUARTAOFF',     receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260610', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260610' },
  { date:'11/06/2026', diaSemana:'quinta-feira',  cupomLigado:true,  criativo:'',                                          merchan1:'R$20 OFF EM COMPRAS A PARTIR DE R$150',       nominal1:'INSTATOP',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260611', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260611' },
  { date:'12/06/2026', diaSemana:'sexta-feira',   cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'LIBERADO',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260612', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260612' },
  { date:'13/06/2026', diaSemana:'sábado',        cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'SABADOPROMO',   receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260613', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260613' },
  { date:'14/06/2026', diaSemana:'domingo',       cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'DOMINGOFREE',   receita1:'', merchan2:'FRETE GRÁTIS + 3X SEM JUROS', nominal2:'DOMINGO3X', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260614', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260614' },
  { date:'15/06/2026', diaSemana:'segunda-feira', cupomLigado:true,  criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'FRETEAGORA',    receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260615', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260615' },
  { date:'16/06/2026', diaSemana:'terça-feira',   cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + MIMO',             nominal1:'TOPTERCA',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260616', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260616' },
  { date:'17/06/2026', diaSemana:'quarta-feira',  cupomLigado:false, criativo:'',                                          merchan1:'FRETE GRÁTIS + MIMO',                        nominal1:'STORYPROMO',    receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260617', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260617' },
  { date:'18/06/2026', diaSemana:'quinta-feira',  cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'QUINTAFREE',    receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260618', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260618' },
  { date:'19/06/2026', diaSemana:'sexta-feira',   cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'LIVEMIMO',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260619', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260619' },
  { date:'20/06/2026', diaSemana:'sábado',        cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + MIMO',             nominal1:'MEGAHOJE',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260620', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260620' },
  { date:'21/06/2026', diaSemana:'domingo',       cupomLigado:false, criativo:'',                                          merchan1:'FRETE GRÁTIS + 3X SEM JUROS',                nominal1:'INSTA3X',       receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260621', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260621' },
  { date:'22/06/2026', diaSemana:'segunda-feira', cupomLigado:false, criativo:'',                                          merchan1:'10% OFF EM COMPRAS A PARTIR DE R$99',         nominal1:'10HOJE',        receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260622', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260622' },
  { date:'23/06/2026', diaSemana:'terça-feira',   cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'FRETEOFF',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260623', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260623' },
  { date:'24/06/2026', diaSemana:'quarta-feira',  cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'QUARTA3X',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260624', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260624' },
  { date:'25/06/2026', diaSemana:'quinta-feira',  cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + MIMO',                             nominal1:'MIMOFREE',      receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260625', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260625' },
  { date:'26/06/2026', diaSemana:'sexta-feira',   cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'PROMOSEXTA',    receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260626', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260626' },
  { date:'27/06/2026', diaSemana:'sábado',        cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + 3X SEM JUROS',                    nominal1:'LIVEOFF',       receita1:'', merchan2:'FRETE GRÁTIS + MIMO', nominal2:'LIVEMIMO', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260627', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260627' },
  { date:'28/06/2026', diaSemana:'domingo',       cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',     nominal1:'PROMOTRIPLA',   receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260628', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260628' },
  { date:'29/06/2026', diaSemana:'segunda-feira', cupomLigado:false, criativo:'',                                          merchan1:'DESCONTO + FRETE GRÁTIS',                    nominal1:'SEGUNDAOFF',    receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260629', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260629' },
  { date:'30/06/2026', diaSemana:'terça-feira',   cupomLigado:false, criativo:'',                                          merchan1:'3X SEM JUROS + MIMO',                        nominal1:'TERCA3X',       receita1:'', merchan2:'', nominal2:'', receita2:'', cupomExtra:'', receitaExtra:'', receitaTotal:'', receitaUtm:'', alcance:'', utmCampaign:'live_20260630', linkUtm:'https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=live_20260630' },
]

function determineStatus(dateStr) {
  const isoDate = parseDate(dateStr)
  if (isoDate < today) return 'realizada'
  if (isoDate === today) return 'confirmada'
  return 'proposta'
}

async function run() {
  // Fetch existing lives for date range
  const { data: existing, error: fetchErr } = await supabase
    .from('lives')
    .select('id, date, status')
    .gte('date', '2026-05-01')
    .lte('date', '2026-06-30')

  if (fetchErr) {
    console.error('Erro ao buscar lives existentes:', fetchErr.message)
    process.exit(1)
  }

  const existingByDate = {}
  for (const row of existing ?? []) {
    existingByDate[row.date] = row
  }

  const inseridas = [], atualizadas = [], puladas = [], erros = []

  for (const r of rows) {
    const isoDate = parseDate(r.date)
    const status = determineStatus(r.date)
    const existing = existingByDate[isoDate]

    const dbRow = {
      date:          isoDate,
      dia_semana:    r.diaSemana,
      cupom_ligado:  r.cupomLigado,
      criativo:      r.criativo.trim(),
      merchan1:      r.merchan1 || null,
      nominal1:      r.nominal1 || null,
      receita1:      parseBRL(r.receita1),
      merchan2:      r.merchan2 || null,
      nominal2:      r.nominal2 || null,
      receita2:      parseBRL(r.receita2),
      cupom_extra:   r.cupomExtra || null,
      receita_extra: parseBRL(r.receitaExtra),
      receita_total: parseBRL(r.receitaTotal) ?? 0,
      receita_utm:   parseBRL(r.receitaUtm),
      alcance:       parseAlcance(r.alcance),
      link_utm:      r.linkUtm || null,
      utm_campaign:  r.utmCampaign || null,
      status,
      origem:        'csv_import',
    }

    if (!existing) {
      const { error } = await supabase.from('lives').insert(dbRow)
      if (error) {
        erros.push({ date: r.date, error: error.message })
      } else {
        inseridas.push(r.date)
      }
    } else if (existing.status === 'proposta') {
      const { error } = await supabase.from('lives').update(dbRow).eq('id', existing.id).eq('status', 'proposta')
      if (error) {
        erros.push({ date: r.date, error: error.message })
      } else {
        atualizadas.push(r.date)
      }
    } else {
      // realizada ou confirmada — não sobrescreve
      puladas.push({ date: r.date, status: existing.status })
    }
  }

  console.log('\n=== RESULTADO ===')
  console.log(`✅ Inseridas (${inseridas.length}):`, inseridas.join(', ') || '—')
  console.log(`🔄 Atualizadas (${atualizadas.length}):`, atualizadas.join(', ') || '—')
  console.log(`⏭️  Puladas — já realizada/confirmada (${puladas.length}):`, puladas.map(p => `${p.date}(${p.status})`).join(', ') || '—')
  if (erros.length) {
    console.log(`❌ Erros (${erros.length}):`)
    erros.forEach(e => console.log(`  ${e.date}: ${e.error}`))
  }
  console.log('\nTotal processado:', rows.length)
}

run().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
