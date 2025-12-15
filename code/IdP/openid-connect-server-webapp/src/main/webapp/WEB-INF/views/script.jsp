<script src="https://cdn.jsdelivr.net/npm/bn.js"></script>
<script>
    const BN = window.BN;
</script>

<script type="text/javascript" src="resources/js/elliptic.js"></script>
<script>
    window.EC = elliptic.ec;
    window.ec = new EC('secp256k1');
    window.BN = elliptic.utils.bn;
</script>
<script type="text/javascript" src="resources/js/hashToCurve.js"></script>
<script type="text/javascript" src="resources/js/IdP.js"></script>


