# Walled garden do Hotspot.
# O hóspede só alcança o portal e o PIX até pagar.
# No Terminal do MikroTik: /import file-name=mikrotik-walled-garden.rsc
# Ou cole no New Terminal. Troque SEU-DOMINIO pelo host do app na nuvem.

/ip hotspot walled-garden
add action=allow comment=wifi-pago dst-host=SEU-DOMINIO
add action=allow comment=wifi-pago dst-host=*.mercadopago.com
add action=allow comment=wifi-pago dst-host=*.mercadopago.com.br
add action=allow comment=wifi-pago dst-host=api.mercadopago.com
add action=allow comment=wifi-pago dst-host=api.mercadopago.com.br
add action=allow comment=wifi-pago dst-host=*.mlstatic.com
add action=allow comment=wifi-pago dst-host=*.mpago.la
add action=allow comment=wifi-pago dst-host=*.pagseguro.uol.com.br
add action=allow comment=wifi-pago dst-host=*.stripe.com
add action=allow comment=wifi-pago dst-host=captive.apple.com
add action=allow comment=wifi-pago dst-host=www.apple.com
add action=allow comment=wifi-pago dst-host=connectivitycheck.gstatic.com
add action=allow comment=wifi-pago dst-host=clients3.google.com
add action=allow comment=wifi-pago dst-host=www.msftconnecttest.com
