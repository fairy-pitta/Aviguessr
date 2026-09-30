import { describe, it, expect } from "vitest";
import {
  isUsableCommonsFile,
  pickInatPhoto,
  type InatObservation,
} from "../lib/image-sources";

describe("isUsableCommonsFile", () => {
  const ok = {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Cistothorus_palustris.jpg/960px-Cistothorus_palustris.jpg",
    license: "CC BY-SA 4.0",
    width: 960,
    height: 640,
  };

  it("test_is_usable_commons_file_with_plain_photo_returns_true", () => {
    expect(isUsableCommonsFile(ok)).toBe(true);
  });

  it("test_is_usable_commons_file_with_audio_icon_returns_false", () => {
    // 98 species in the current dataset share this 120x120 icon
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Fileicon-ogg.png/120px-Fileicon-ogg.png",
        width: 120,
        height: 120,
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_museum_specimen_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Naturalis_Biodiversity_Center_-_RMNH.AVES.147983_2_-_Alcippe_brunnea.jpg/960px-x.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_study_skin_drawer_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/LSU_Museum_of_Natural_Science_-_Study_skins_of_birds.jpg/960px-x.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_pdf_page_scan_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Journal_of_the_Bombay_Natural_History_Society.pdf/page1-500px-Journal.pdf.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_djvu_page_scan_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Birds_of_North_and_Middle_America.djvu/page1-960px-x.djvu.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_png_original_returns_false", () => {
    // PNG originals in this dataset are distribution maps and icons
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Alpine_Tapaculo_map.png/960px-Alpine_Tapaculo_map.png",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_distribution_map_name_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Distribution_Grallaria_alleni.jpg/960px-x.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_historical_plate_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Iconographia_Zoologica_-_Pharomacrus_fulgidus.jpg/960px-x.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_with_monograph_plate_returns_false", () => {
    expect(
      isUsableCommonsFile({
        ...ok,
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MonographTrochi4Goul_0142.jpg/960px-x.jpg",
      })
    ).toBe(false);
  });

  it("test_is_usable_commons_file_below_minimum_size_returns_false", () => {
    expect(isUsableCommonsFile({ ...ok, width: 320, height: 240 })).toBe(false);
  });

  it("test_is_usable_commons_file_with_non_permissive_license_returns_false", () => {
    expect(isUsableCommonsFile({ ...ok, license: "CC BY-NC 4.0" })).toBe(false);
  });

  it("test_is_usable_commons_file_with_public_domain_license_returns_true", () => {
    expect(isUsableCommonsFile({ ...ok, license: "Public domain" })).toBe(true);
  });
});

describe("pickInatPhoto", () => {
  function obs(overrides: Partial<InatObservation> = {}): InatObservation {
    return {
      quality_grade: "research",
      taxon: { name: "Cistothorus palustris" },
      photos: [
        {
          url: "https://inaturalist-open-data.s3.amazonaws.com/photos/1/square.jpg",
          license_code: "cc-by",
          attribution: "(c) Someone, some rights reserved (CC BY)",
        },
      ],
      ...overrides,
    };
  }

  it("test_pick_inat_photo_with_research_grade_permissive_photo_returns_medium_url", () => {
    const picked = pickInatPhoto([obs()], "Cistothorus palustris");
    expect(picked?.url).toBe(
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1/medium.jpg"
    );
    expect(picked?.license).toBe("CC BY");
  });

  it("test_pick_inat_photo_with_cc0_photo_reports_public_domain_license", () => {
    const picked = pickInatPhoto(
      [obs({ photos: [{ url: "https://x/photos/2/square.jpg", license_code: "cc0", attribution: "no rights reserved" }] })],
      "Cistothorus palustris"
    );
    expect(picked?.license).toBe("CC0");
  });

  it("test_pick_inat_photo_with_all_rights_reserved_photo_returns_null", () => {
    const picked = pickInatPhoto(
      [obs({ photos: [{ url: "https://x/photos/3/square.jpg", license_code: null, attribution: "(c) Someone, all rights reserved" }] })],
      "Cistothorus palustris"
    );
    expect(picked).toBeNull();
  });

  it("test_pick_inat_photo_with_noncommercial_photo_returns_null", () => {
    const picked = pickInatPhoto(
      [obs({ photos: [{ url: "https://x/photos/4/square.jpg", license_code: "cc-by-nc", attribution: "(c) Someone (CC BY-NC)" }] })],
      "Cistothorus palustris"
    );
    expect(picked).toBeNull();
  });

  it("test_pick_inat_photo_with_non_research_grade_observation_returns_null", () => {
    expect(pickInatPhoto([obs({ quality_grade: "needs_id" })], "Cistothorus palustris")).toBeNull();
  });

  it("test_pick_inat_photo_with_mismatched_taxon_returns_null", () => {
    expect(pickInatPhoto([obs({ taxon: { name: "Cistothorus stellaris" } })], "Cistothorus palustris")).toBeNull();
  });

  it("test_pick_inat_photo_skips_unusable_observation_and_takes_the_next", () => {
    const bad = obs({ quality_grade: "needs_id" });
    const good = obs({ photos: [{ url: "https://x/photos/9/square.jpeg", license_code: "cc-by-sa", attribution: "(c) B (CC BY-SA)" }] });
    const picked = pickInatPhoto([bad, good], "Cistothorus palustris");
    expect(picked?.url).toBe("https://x/photos/9/medium.jpeg");
  });

  it("test_pick_inat_photo_with_empty_results_returns_null", () => {
    expect(pickInatPhoto([], "Cistothorus palustris")).toBeNull();
  });

  it("test_pick_inat_photo_skips_photo_already_used_by_another_species", () => {
    // 98 species in the old dataset shared one file; never hand back a duplicate
    const used = new Set([
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1/medium.jpg",
    ]);
    expect(pickInatPhoto([obs()], "Cistothorus palustris", used)).toBeNull();
  });

  it("test_pick_inat_photo_with_used_first_photo_falls_through_to_the_next", () => {
    const used = new Set([
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1/medium.jpg",
    ]);
    const second = obs({
      photos: [
        { url: "https://x/photos/7/square.jpg", license_code: "cc-by", attribution: "(c) C (CC BY)" },
      ],
    });
    const picked = pickInatPhoto([obs(), second], "Cistothorus palustris", used);
    expect(picked?.url).toBe("https://x/photos/7/medium.jpg");
  });

  it("test_pick_inat_photo_extracts_photographer_from_attribution", () => {
    const picked = pickInatPhoto([obs()], "Cistothorus palustris");
    expect(picked?.artist).toBe("Someone");
  });

  it("test_pick_inat_photo_with_cc0_attribution_falls_back_to_observer_name", () => {
    // CC0 attributions are just "no rights reserved" — no name to parse
    const picked = pickInatPhoto(
      [
        obs({
          photos: [{ url: "https://x/photos/5/square.jpg", license_code: "cc0", attribution: "no rights reserved" }],
          user: { login: "wang_qg", name: "Wang QG" },
        }),
      ],
      "Cistothorus palustris"
    );
    expect(picked?.artist).toBe("Wang QG");
  });

  it("test_pick_inat_photo_with_cc0_and_no_observer_name_uses_login", () => {
    const picked = pickInatPhoto(
      [
        obs({
          photos: [{ url: "https://x/photos/6/square.jpg", license_code: "cc0", attribution: "no rights reserved" }],
          user: { login: "desertnaturalist", name: null },
        }),
      ],
      "Cistothorus palustris"
    );
    expect(picked?.artist).toBe("desertnaturalist");
  });

  it("test_pick_inat_photo_reads_uploader_from_attribution_when_present", () => {
    const picked = pickInatPhoto(
      [
        obs({
          photos: [{ url: "https://x/photos/8/square.jpg", license_code: "cc0", attribution: "no rights reserved, uploaded by Hickson Fergusson" }],
          user: { login: "someone_else", name: "Someone Else" },
        }),
      ],
      "Cistothorus palustris"
    );
    expect(picked?.artist).toBe("Hickson Fergusson");
  });

  it("test_pick_inat_photo_never_uses_a_licence_phrase_as_the_artist", () => {
    const picked = pickInatPhoto(
      [
        obs({
          photos: [{ url: "https://x/photos/11/square.jpg", license_code: "cc0", attribution: "no rights reserved" }],
          user: null,
        }),
      ],
      "Cistothorus palustris"
    );
    expect(picked?.artist).toBe("");
  });
});
