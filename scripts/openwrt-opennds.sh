#!/bin/sh
# OpenWrt + openNDS: portal cativo apontando para o app na nuvem.
# Rode no SSH do roteador. Troque SEU-DOMINIO.

set -e

opkg update
opkg install opennds

uci set opennds.@opennds[0].enabled='1'
uci set opennds.@opennds[0].fasport='443'
uci set opennds.@opennds[0].fasremotefqdn='SEU-DOMINIO'
uci set opennds.@opennds[0].faspath='/'
uci set opennds.@opennds[0].fas_secure_enabled='0'

uci commit opennds
/etc/init.d/opennds enable
/etc/init.d/opennds restart

echo "Depois cole o script de walled garden (portal + PIX)."
echo "No .env da nuvem: NETWORK_PROVIDER=openwrt OPENWRT_HOST=IP-DO-TUNEL"
