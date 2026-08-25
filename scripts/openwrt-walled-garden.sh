#!/bin/sh
# Walled garden do openNDS: o hóspede só alcança o portal e o PIX até pagar.
# Cole no SSH do OpenWrt. Troque SEU-DOMINIO.

set -e

uci add_list opennds.@opennds[0].walledgarden_fqdn_list='SEU-DOMINIO'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='mercadopago.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='mercadopago.com.br'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='mlstatic.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='mpago.la'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='pagseguro.uol.com.br'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='stripe.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='captive.apple.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='apple.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='connectivitycheck.gstatic.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='clients3.google.com'
uci add_list opennds.@opennds[0].walledgarden_fqdn_list='msftconnecttest.com'

uci commit opennds
/etc/init.d/opennds restart
