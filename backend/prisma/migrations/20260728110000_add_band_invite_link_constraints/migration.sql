-- CreateIndex
CREATE UNIQUE INDEX "band_invite_link_band_id_key" ON "band_invite_link"("band_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_invite_link_code_key" ON "band_invite_link"("code");
