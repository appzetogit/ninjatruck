import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/axiosInstance';
import { NINJA_BRAND } from './ninjaBrand';

const FLEET = [
  { photo: 'ninja-van', name: 'Mini Truck' },
  { photo: 'scooter', name: 'Scooty' },
  { photo: 'courier-bike', name: 'Bike Courier' },
  { photo: 'mini-ev', name: 'Mini EV' },
  { photo: 'tata-ace', name: 'Tata Ace' },
  { photo: 'pickup', name: 'Pickup' },
  { photo: 'tata-407', name: 'Tata 407' },
];
const PACKAGES = [
  { hours: 1, label: 'Per Hour' },
  { hours: 6, label: '6 Hours' },
  { hours: 12, label: '12 Hours' },
];
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const packageOf = (vehicle, hours) =>
  (vehicle.pricing || []).find((p) => Number(p.durationHours) === hours && p.active !== false);

/** Vehicle photos, then the live "Rental With Driver" price list from admin. */
export default function FleetSection() {
  const [rentals, setRentals] = useState([]);

  useEffect(() => {
    let alive = true;
    api
      .get('/users/rental-vehicles')
      .then((res) => {
        const list = res?.data?.results || res?.results || [];
        if (!alive || !Array.isArray(list)) return;
        setRentals(
          list
            .filter((v) => packageOf(v, 1))
            .sort((a, b) => packageOf(a, 1).price - packageOf(b, 1).price),
        );
      })
      .catch(() => {}); // the photos still show without the price list
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="fleet" className="py-24 px-6 lg:px-16 bg-[#F9C105] border-t-2 border-[#111111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-white font-black tracking-widest text-lg uppercase mb-4 drop-shadow-sm">- Our Fleet -</h2>
          <h3 className="text-4xl lg:text-6xl font-black text-[#111111] tracking-tighter uppercase">Pick Your Ride</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          {FLEET.map(({ photo, name }) => (
            <figure
              key={photo}
              className="w-[calc(50%-0.625rem)] sm:w-60 bg-white border-2 border-[#111111] rounded-2xl overflow-hidden shadow-[5px_5px_0_0_#111111]"
            >
              <img src={`/fleet/${photo}.webp`} alt={name} loading="lazy" className="w-full aspect-[4/3] object-contain" />
              <figcaption className="bg-[#111111] text-[#F9C105] font-black uppercase tracking-wide text-center py-3">{name}</figcaption>
            </figure>
          ))}
        </div>

        {rentals.length > 0 && (
          <div id="rental" className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-center text-3xl lg:text-5xl font-black text-[#111111] tracking-tighter uppercase mb-8">
              Rental With Driver
            </h3>
            <div className="bg-white border-2 border-[#111111] rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#111111]">
              <table className="w-full text-left text-[#111111]">
                <thead className="bg-[#111111] text-[#F9C105] uppercase">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 font-black text-xs sm:text-base">Vehicle</th>
                    {PACKAGES.map(({ hours, label }) => (
                      <th key={hours} className="px-2 sm:px-6 py-4 font-black text-right text-xs sm:text-base">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((v) => (
                    <tr key={v.id} className="border-t-2 border-[#111111]/10">
                      <td className="px-3 sm:px-6 py-3">
                        <div className="flex items-center gap-4 font-black text-sm sm:text-lg leading-tight">
                          <img src={v.image} alt="" loading="lazy" className="hidden sm:block w-20 h-14 object-contain" />
                          {v.name}
                        </div>
                      </td>
                      {PACKAGES.map(({ hours }) => {
                        const p = packageOf(v, hours);
                        return (
                          <td key={hours} className="px-2 sm:px-6 py-3 text-right">
                            {p ? (
                              <>
                                <div className="font-black text-base sm:text-xl">{rupees(p.price)}</div>
                                <div className="text-[11px] sm:text-sm font-bold text-slate-600">up to {p.includedKm} km</div>
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                to="/taxi/user/rental"
                className="inline-block bg-white text-[#111111] border-2 border-[#111111] px-8 py-4 font-black tracking-widest uppercase"
              >
                Book Online
              </Link>
              <a
                href={`tel:${NINJA_BRAND.phone}`}
                className="inline-block bg-[#111111] text-[#F9C105] hover:bg-black px-8 py-4 font-black tracking-widest uppercase"
              >
                Call To Book {NINJA_BRAND.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
