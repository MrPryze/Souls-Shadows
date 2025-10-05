VAR area = "cave"

=== snip_channel_pool ===
Soul skims the water’s skin; it hums like a throat.
-> END

=== snip_channel_default ===
You draw the thread. The cave air cools to glass.
-> END

=== snip_sleep_default ===
You let the stone hold you. Breath turns slow and numbered.
-> END

=== dlg_pool_drink ===
Up close, the pool shivers. It smells like rain and iron.

+ [Drink it]
    #key:drink
    The surface clings to your lip like a mouth.
    -> END

+ [Leave it]
    #key:leave
    You pull back. Something below the surface sighs.
    -> END

=== dlg_rat_intro ===
A skitter of claws interrupts the void. A rat stares at you.

+ [Pet]
    The rat blinks, baffled. It allows it—barely.
    #key:leave
    -> END

+ [Attack]
    Teeth. Blood. Breath.
    #key:eat
    -> END

+ [Leave]
    #key:leave
    You look away. It looks away.
    -> END
